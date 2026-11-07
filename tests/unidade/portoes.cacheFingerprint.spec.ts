import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Portão de cache invertido (scripts/verificar-cache-fingerprint.ts, 7.3): nenhum
 * `immutable` nem `public` no .htaccess, nos PHP da API, nem no Cache-Control
 * efetivo de arquivo de dist. Cada caso monta uma árvore sintética (L-36) e
 * sabota um ponto. Gêmeo: servidor/testes/estatico.teste.php (mesma regra).
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const VERIFICADOR = join(RAIZ, 'scripts/verificar-cache-fingerprint.ts');
const HTACCESS_REAL = join(RAIZ, 'public/.htaccess');
const LINHA_PROIBIDA = '  Header set Cache-Control "public, max-age=31536000, immutable"';

let tmp: string;
let raiz: string;

function rodar() {
  return spawnSync(process.execPath, ['--import', 'tsx', VERIFICADOR], {
    cwd: RAIZ,
    encoding: 'utf-8',
    env: { ...process.env, VERIFICAR_CACHE_FINGERPRINT_RAIZ: raiz }
  });
}

function plantar(caminhoRelativo: string, conteudo: string): void {
  const caminho = join(raiz, caminhoRelativo);
  mkdirSync(join(caminho, '..'), { recursive: true });
  writeFileSync(caminho, conteudo);
}

function saida(r: { stdout: string; stderr: string }): string {
  return r.stdout + r.stderr;
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'cache-fingerprint-'));
  raiz = join(tmp, 'raiz');
  plantar('public/.htaccess', readFileSync(HTACCESS_REAL, 'utf-8'));
  plantar('public/api/saude.php', "<?php\nheader('Cache-Control: private, no-store');\n");
  plantar('servidor/dev/roteador.php', "<?php\nheader('Cache-Control: private, no-store');\n");
  plantar('dist/index.html', '<!doctype html>');
  plantar('dist/sw.js', 'self.x = 1;');
  plantar('dist/assets/app.js', 'console.log("app");');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('portão de cache invertido', () => {
  it('pacote sem immutable nem public passa e imprime o piso', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    expect(saida(r)).toMatch(/com cache imutável ou público: 0/);
  });

  it('immutable no .htaccess reprova, mesmo com nome de arquivo com hash', () => {
    const htaccess = readFileSync(join(raiz, 'public/.htaccess'), 'utf-8').replace(
      '</IfModule>',
      `${LINHA_PROIBIDA}\n</IfModule>`
    );
    plantar('public/.htaccess', htaccess);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('immutable');
  });

  it('public no .htaccess reprova', () => {
    const htaccess = readFileSync(join(raiz, 'public/.htaccess'), 'utf-8').replace(
      '</IfModule>',
      '  Header set Cache-Control "public, max-age=3600"\n</IfModule>'
    );
    plantar('public/.htaccess', htaccess);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('public');
  });

  it('header public num PHP da API reprova, com o nome do arquivo', () => {
    plantar('public/api/saude.php', "<?php\nheader('Cache-Control: public, max-age=60');\n");
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('saude.php');
  });

  it('a palavra public fora de Cache-Control (código PHP) não reprova', () => {
    plantar(
      'public/api/saude.php',
      "<?php\nclass A { public function f() {} }\nheader('Cache-Control: private, no-store');\n"
    );
    const r = rodar();
    expect(r.status).toBe(0);
  });

  it('.htaccess sem nenhuma linha Header é varredura vazia e reprova', () => {
    plantar('public/.htaccess', 'RewriteEngine On\n');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('zero');
  });

  it('dist sem arquivo algum reprova', () => {
    rmSync(join(raiz, 'dist'), { recursive: true, force: true });
    mkdirSync(join(raiz, 'dist'));
    const r = rodar();
    expect(r.status).toBe(1);
  });
});
