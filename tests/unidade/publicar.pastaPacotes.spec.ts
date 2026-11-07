import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh, pasta dos pacotes guardados entre --preparar e --concluir (LU-F4.3, revisão
 * de segurança). Caminho previsível em diretório compartilhado é risco: outro usuário ou um symlink
 * trocaria o pacote. A pasta tem de ser diretório real, sem symlink no caminho, dono o usuário
 * atual e modo 700. Cada função é extraída do script, sem rodar o publicar inteiro.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLICAR = join(RAIZ, 'scripts/publicar.sh');
const FONTE = readFileSync(PUBLICAR, 'utf-8');

let tmp: string;

function funcao(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  if (!m) throw new Error(`função ${nome} não encontrada em publicar.sh`);
  return m[0];
}

/** Roda uma função do publicar.sh com a pasta dada. Devolve rc e saída. */
function rodar(corpo: string, pasta: string): { status: number | null; saida: string } {
  const r = spawnSync(
    'bash',
    [
      '-c',
      [
        'set -euo pipefail',
        funcao('recusar'),
        funcao('conferir_pasta_segura'),
        funcao('preparar_pasta_pacotes'),
        `PASTA_PACOTES='${pasta}'`,
        corpo,
        'echo passou'
      ].join('\n')
    ],
    { encoding: 'utf-8' }
  );
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-pastas-'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('pasta dos pacotes do publicar (LU-F4.3, revisão de segurança)', () => {
  it('o padrão não fica em diretório compartilhado nem dentro do IDrive', () => {
    const padrao = FONTE.match(/^PASTA_PACOTES="\$\{PUBLICAR_PASTA_PACOTES-(.+)\}"$/m)?.[1];
    expect(padrao).toBeDefined();
    expect(padrao).toContain('XDG_STATE_HOME');
    expect(padrao).toContain('caderno-publicar');
    expect(padrao?.startsWith('/var/tmp')).toBe(false);
    expect(padrao?.includes('IDrive')).toBe(false);
  });

  it('pasta inexistente é criada em 700 e passa', () => {
    const pasta = join(tmp, 'pacotes');
    const r = rodar('preparar_pasta_pacotes', pasta);
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('passou');
    expect(rodar(`conferir_pasta_segura '${pasta}'`, pasta).status).toBe(0);
  });

  it('pasta existente, real, do usuário e em 700 passa', () => {
    const pasta = join(tmp, 'ok');
    mkdirSync(pasta, { mode: 0o700 });
    chmodSync(pasta, 0o700);
    const r = rodar('preparar_pasta_pacotes', pasta);
    expect(r.status, r.saida).toBe(0);
  });

  it('modo diferente de 700 recusa, sem apagar nem usar a pasta', () => {
    const pasta = join(tmp, 'aberta');
    mkdirSync(pasta);
    chmodSync(pasta, 0o755);
    const r = rodar('preparar_pasta_pacotes', pasta);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('modo');
    expect(r.saida).not.toContain('passou');
  });

  it('symlink no lugar da pasta recusa (sabotagem em cópia: aponta para pasta real em 700)', () => {
    const real = join(tmp, 'real');
    mkdirSync(real, { mode: 0o700 });
    chmodSync(real, 0o700);
    const link = join(tmp, 'link');
    symlinkSync(real, link);
    const r = rodar('preparar_pasta_pacotes', link);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('symlink');
    expect(r.saida).not.toContain('passou');
  });

  it('componente-link no caminho recusa, mesmo com a folha real e em 700', () => {
    const real = join(tmp, 'real');
    mkdirSync(join(real, 'folha'), { recursive: true });
    chmodSync(join(real, 'folha'), 0o700);
    const link = join(tmp, 'atalho');
    symlinkSync(real, link);
    const r = rodar(`conferir_pasta_segura '${join(link, 'folha')}'`, join(link, 'folha'));
    expect(r.status).toBe(1);
    expect(r.saida).toContain('caminho');
  });

  it('caminho que é arquivo, não pasta, recusa', () => {
    const arq = join(tmp, 'arquivo');
    writeFileSync(arq, 'x', { mode: 0o600 });
    const r = rodar('preparar_pasta_pacotes', arq);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('não é diretório');
  });
});
