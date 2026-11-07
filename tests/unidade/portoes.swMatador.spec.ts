import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Portão do service worker matador (scripts/verificar-sw-matador.ts, que troca
 * o verificar-sw-api). Cada caso planta uma sabotagem numa cópia da pasta de
 * build (L-36). Só o caso de identidade mexe na dist sozinha; os de conteúdo
 * mexem na referência e na dist, para que o critério certo reprove.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const VERIFICADOR = join(RAIZ, 'scripts/verificar-sw-matador.ts');
const SW_REAL = join(RAIZ, 'public/sw.js');
const LACO_NAVEGACAO =
  '\nself.clients.matchAll({ type: "window" }).then((l) => l.forEach((j) => j.navigate(j.url)));\n';

let tmp: string;
let dist: string;
let referencia: string;

function rodar() {
  return spawnSync(process.execPath, ['--import', 'tsx', VERIFICADOR], {
    cwd: RAIZ,
    encoding: 'utf-8',
    env: { ...process.env, DIST_PATH: dist, VERIFICAR_SW_REFERENCIA: referencia }
  });
}

function plantar(nome: string, conteudo: string): void {
  const caminho = join(dist, nome);
  mkdirSync(join(caminho, '..'), { recursive: true });
  writeFileSync(caminho, conteudo);
}

function saida(r: { stdout: string; stderr: string }): string {
  return r.stdout + r.stderr;
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'sw-matador-'));
  dist = join(tmp, 'dist');
  mkdirSync(dist);
  referencia = join(tmp, 'referencia-sw.js');
  copyFileSync(SW_REAL, referencia);
  copyFileSync(SW_REAL, join(dist, 'sw.js'));
  plantar('index.html', '<!doctype html><title>site</title>');
  plantar('assets/app.js', 'console.log("app");');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('portão do service worker matador', () => {
  it('o matador do pacote, igual ao público, passa com falharam=0', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    expect(saida(r)).toContain('falharam=0');
  });

  it('sw.js da dist diferente do público (laço de navegação só no pacote) reprova', () => {
    writeFileSync(join(dist, 'sw.js'), readFileSync(SW_REAL, 'utf-8') + LACO_NAVEGACAO);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('não é igual');
  });

  it('variante com laço de janela.navigate reprova pela regra do texto, em ambos', () => {
    const com = readFileSync(SW_REAL, 'utf-8') + LACO_NAVEGACAO;
    writeFileSync(referencia, com);
    writeFileSync(join(dist, 'sw.js'), com);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('navigate');
  });

  it('sw com importScripts (cara de workbox) reprova, em ambos', () => {
    const com = `importScripts("workbox-5824ddf3.js");\n${readFileSync(SW_REAL, 'utf-8')}`;
    writeFileSync(referencia, com);
    writeFileSync(join(dist, 'sw.js'), com);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('importScripts');
  });

  it('workbox-*.js na dist reprova', () => {
    plantar('workbox-5824ddf3.js', '/* sintetico */');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('workbox');
  });

  it('registro do service worker num asset reprova (laço de reinstalação)', () => {
    plantar('assets/app.js', 'navigator.serviceWorker.register("/sw.js");');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('register');
  });

  it('registerSW.js na dist reprova', () => {
    plantar('assets/registerSW.js', '/* sintetico */');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('register');
  });

  it('manifest.webmanifest na dist reprova', () => {
    plantar('manifest.webmanifest', '{}');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('manifest');
  });

  it('link rel=manifest no index.html reprova', () => {
    plantar('index.html', '<link rel="manifest" href="/manifest.webmanifest">');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('manifest');
  });

  it('dist sem sw.js reprova (varredura vazia é falha)', () => {
    rmSync(join(dist, 'sw.js'));
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('sw.js ausente');
  });
});
