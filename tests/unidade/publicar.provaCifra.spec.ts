import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh, prova de cifra (LU-F4.3, plano 6.2). contar_cifra percorre os arquivos
 * com filter=git-crypt de um commit e confere a magia (\0GITCRYPT\0) no blob. Antes, o teste lia
 * o blob por um pipe com pipefail: com blob maior que o buffer do pipe, o head fechava cedo, o cat
 * recebia SIGPIPE e o arquivo cifrado saía como "em claro" (falso positivo, visto no ciclo local).
 * Este spec fixa o caso grande e o caso em claro, num repositório descartável.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FONTE = readFileSync(join(RAIZ, 'scripts/publicar.sh'), 'utf-8');

let tmp: string;

function funcao(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  if (!m) throw new Error(`função ${nome} não encontrada em publicar.sh`);
  return m[0];
}

function git(cwd: string, args: string[]): void {
  spawnSync(
    'git',
    ['-c', 'user.name=teste', '-c', 'user.email=teste@exemplo.invalido', '-c', 'commit.gpgSign=false', ...args],
    { cwd, encoding: 'utf-8' }
  );
}

/** Repositório com .gitattributes de git-crypt e os arquivos dados (blob gravado como está, sem filtro). */
function repositorio(arquivos: Record<string, Buffer>): string {
  const dir = join(tmp, 'repo');
  spawnSync('git', ['init', '-q', '-b', 'main', dir]);
  writeFileSync(join(dir, '.gitattributes'), 'segredo/** filter=git-crypt diff=git-crypt\n');
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    const alvo = join(dir, caminho);
    spawnSync('mkdir', ['-p', dirname(alvo)]);
    writeFileSync(alvo, conteudo);
  }
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'teste']);
  return dir;
}

function contar(dir: string, ref: string): { status: number | null; saida: string } {
  const r = spawnSync(
    'bash',
    [
      '-c',
      ['set -euo pipefail', funcao('recusar'), funcao('contar_cifra'), `contar_cifra '${dir}' '${ref}'`, 'echo passou'].join('\n')
    ],
    { encoding: 'utf-8' }
  );
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-cifra-'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('prova de cifra do publicar (LU-F4.3, 6.2)', () => {
  it('blob cifrado maior que o buffer do pipe passa como cifrado (sem falso positivo)', () => {
    const magia = Buffer.from([0x00, 0x47, 0x49, 0x54, 0x43, 0x52, 0x59, 0x50, 0x54, 0x00]);
    const grande = Buffer.concat([magia, Buffer.alloc(200_000, 7)]);
    const dir = repositorio({ 'segredo/grande.bin': grande });
    const r = contar(dir, 'HEAD');
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('encontrados=1 analisados=1 em_claro=0');
    expect(r.saida).toContain('passou');
  });

  it('arquivo com filter=git-crypt e texto em claro reprova e nomeia o caminho', () => {
    const dir = repositorio({ 'segredo/nota.txt': Buffer.from('texto de estudo em claro\n') });
    const r = contar(dir, 'HEAD');
    expect(r.status).toBe(1);
    expect(r.saida).toContain('EM CLARO: segredo/nota.txt');
    expect(r.saida).not.toContain('passou');
  });

  it('zero arquivo cifrado no commit é varredura quebrada: reprova', () => {
    const dir = repositorio({ 'publico.txt': Buffer.from('aberto\n') });
    const r = contar(dir, 'HEAD');
    expect(r.status).toBe(1);
    expect(r.saida).toContain('varredura quebrada');
  });
});
