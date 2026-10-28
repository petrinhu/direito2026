import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Gêmeo do portão de vazamento do Interdisciplinar, para a Júri
 * (scripts/verificar-conteudo-restrito-juri.ts). O estado vem do cadeira.ts
 * (CADEIRA_JURI): em-breve passa sem o JSON privado; publicado exige o JSON
 * (CADERNO_RESTRITO_JURI) e reprova sem ele (fail-closed). O texto do JSON
 * nunca pode aparecer na saída do portão.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const GEMEO = join(RAIZ, 'scripts/verificar-conteudo-restrito-juri.ts');
const PRECI = join(RAIZ, 'scripts/preci.sh');
const TRECHO = 'Trecho distintivo sintetico do juri com mais de quarenta caracteres para o teste';

let tmp: string;
let dist: string;

interface Caso {
  estado?: string;
  cadeira?: string;
  json?: string;
  distCaminho?: string;
}

function escrever(nome: string, conteudo: string): string {
  const caminho = join(tmp, nome);
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, conteudo);
  return caminho;
}

function cadeiraCom(estado: string): string {
  return escrever(
    `cadeira-${estado}.ts`,
    `export const cadeira = { nome: 'Juri Simulado', ordem: 6, estado: '${estado}', restrita: true, area: 'juri' };\n`
  );
}

function rodar(caso: Caso) {
  const env: Record<string, string | undefined> = {
    ...process.env,
    DIST_PATH: caso.distCaminho ?? dist
  };
  delete env.CADERNO_RESTRITO_JURI;
  env.CADEIRA_JURI = caso.cadeira ?? cadeiraCom(caso.estado ?? 'publicado');
  if (caso.json !== undefined) env.CADERNO_RESTRITO_JURI = caso.json;
  return spawnSync(process.execPath, ['--import', 'tsx', GEMEO], {
    cwd: RAIZ,
    encoding: 'utf-8',
    env
  });
}

function saidaCompleta(r: { stdout: string; stderr: string }): string {
  return r.stdout + r.stderr;
}

function jsonComTrecho(): string {
  return escrever(
    'juri-privado.json',
    JSON.stringify({ resumo: [{ corpoHtml: `<p>${TRECHO}</p>` }] })
  );
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'juri-gemeo-'));
  dist = join(tmp, 'dist');
  mkdirSync(join(dist, 'assets'), { recursive: true });
  writeFileSync(
    join(dist, 'index.html'),
    '<!doctype html><p>Pagina publica sem nada restrito.</p>'
  );
  writeFileSync(join(dist, 'assets', 'app.js'), 'console.log("pacote publico");');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('gêmeo de vazamento da Júri', () => {
  it('cadeira em-breve passa sem o JSON e imprime a linha de estado', () => {
    const r = rodar({ estado: 'em-breve' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('juri: 0 analisados, cadeira não publicada');
  });

  it('cadeira em-breve passa mesmo com variável apontando para arquivo inexistente', () => {
    const r = rodar({ estado: 'em-breve', json: join(tmp, 'nao-existe.json') });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('juri: 0 analisados, cadeira não publicada');
  });

  it('estado fora de em-breve/publicado (typo) reprova, nunca passa em silêncio', () => {
    const r = rodar({ estado: 'Publicado', json: jsonComTrecho() });
    expect(r.status).toBe(1);
    expect(r.stdout).not.toContain('cadeira não publicada');
  });

  it('cadeira publicada SEM CADERNO_RESTRITO_JURI reprova (fail-closed)', () => {
    const r = rodar({ estado: 'publicado' });
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('CADERNO_RESTRITO_JURI');
  });

  it('cadeira publicada com variável para arquivo inexistente reprova', () => {
    const r = rodar({ estado: 'publicado', json: join(tmp, 'nao-existe.json') });
    expect(r.status).toBe(1);
  });

  it('cadeira publicada com JSON malformado reprova', () => {
    const r = rodar({ estado: 'publicado', json: escrever('ruim.json', '{ nao e json') });
    expect(r.status).toBe(1);
  });

  it('cadeira publicada com JSON sem trecho de 40+ caracteres reprova (varredura quebrada)', () => {
    const r = rodar({
      estado: 'publicado',
      json: escrever('curto.json', JSON.stringify({ a: 'curto', b: 12 }))
    });
    expect(r.status).toBe(1);
  });

  it('cadeira publicada com trecho do JSON no dist reprova, sem imprimir o texto', () => {
    writeFileSync(join(dist, 'assets', 'vazou.js'), `var x = "${TRECHO.toUpperCase()}";`);
    const r = rodar({ estado: 'publicado', json: jsonComTrecho() });
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('falharam=1');
    expect(saidaCompleta(r)).not.toContain('sintetico');
    expect(saidaCompleta(r)).not.toContain('distintivo');
  });

  it('cadeira publicada com dist limpo passa e conta os arquivos analisados', () => {
    const r = rodar({ estado: 'publicado', json: jsonComTrecho() });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/analisados=[1-9]\d* /);
  });

  it('cadeira publicada com dist ausente reprova', () => {
    const r = rodar({ estado: 'publicado', json: jsonComTrecho(), distCaminho: join(tmp, 'nao') });
    expect(r.status).toBe(1);
  });

  it('o preci chama o gêmeo logo depois do portão do Interdisciplinar', () => {
    const preci = readFileSync(PRECI, 'utf-8');
    const indiceInterdisciplinar = preci.indexOf('scripts/verificar-conteudo-restrito.ts');
    const indiceJuri = preci.indexOf('scripts/verificar-conteudo-restrito-juri.ts');
    expect(indiceInterdisciplinar).toBeGreaterThan(0);
    expect(indiceJuri).toBeGreaterThan(indiceInterdisciplinar);
  });
});
