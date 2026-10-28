import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Portão de build da Júri (scripts/verificar-juri-fora-do-pacote.ts): nenhum
 * arquivo privado da Júri pode estar em dist/. Cada caso planta um arquivo
 * sintético e prova que o portão reprova pelo critério certo: a extensão
 * `.juri` sozinha, o magic "JURI" sozinho e o nome proibido sozinho. Assim,
 * sabotar um critério só fica vermelho se o caso dele existir.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const VERIFICADOR = join(RAIZ, 'scripts/verificar-juri-fora-do-pacote.ts');
const MAGIC = Buffer.from('JURI', 'ascii');

let tmp: string;
let dist: string;

function rodar(distCaminho: string = dist) {
  return spawnSync(process.execPath, ['--import', 'tsx', VERIFICADOR], {
    cwd: RAIZ,
    encoding: 'utf-8',
    env: { ...process.env, DIST_PATH: distCaminho }
  });
}

function plantar(nome: string, conteudo: string | Buffer): void {
  const caminho = join(dist, nome);
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, conteudo);
}

function saidaCompleta(r: { stdout: string; stderr: string }): string {
  return r.stdout + r.stderr;
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'juri-fora-do-pacote-'));
  dist = join(tmp, 'dist');
  mkdirSync(dist);
  plantar('index.html', '<!doctype html><title>site</title>');
  plantar('assets/app.js', 'console.log("pacote publico");');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('portão da Júri fora do pacote', () => {
  it('dist limpo passa e imprime encontrados/analisados/falharam', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    expect(saidaCompleta(r)).toContain('encontrados=2 analisados=2 falharam=0');
  });

  it('arquivo .juri reprova pela extensão, mesmo sem o magic', () => {
    plantar('assets/x.juri', 'conteudo qualquer sem magic');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('falharam=1');
  });

  it('arquivo com magic JURI reprova pelo conteúdo, mesmo com extensão inocente', () => {
    plantar('imagens/foto.png', Buffer.concat([MAGIC, Buffer.from([1, 1, 0, 0])]));
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('falharam=1');
  });

  it.each(['acervo.json', 'credencial-admin.json', 'ids.tsv', 'conferencia.tsv', 'juri.json'])(
    'nome proibido %s reprova, mesmo sem o magic',
    (nome) => {
      plantar(`sub/${nome}`, '{"sem":"magic"}');
      const r = rodar();
      expect(r.status).toBe(1);
      expect(saidaCompleta(r)).toContain('falharam=1');
    }
  );

  it('dist sem arquivo algum reprova (varredura vazia é falha, L-36)', () => {
    rmSync(join(dist, 'index.html'));
    rmSync(join(dist, 'assets'), { recursive: true, force: true });
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('encontrados=0 analisados=0 falharam=0');
  });

  it('dist ausente reprova (falha fechada)', () => {
    const r = rodar(join(tmp, 'nao-existe'));
    expect(r.status).toBe(1);
  });

  it('o build chama o verificador', () => {
    const pacote = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
    };
    expect(pacote.scripts.build).toContain('scripts/verificar-juri-fora-do-pacote.ts');
  });
});
