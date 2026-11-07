import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Portão de build do .htaccess (scripts/verificar-htaccess-pastas.ts). Cada caso
 * planta uma pasta de pacote sintética e prova o critério que a sabotagem
 * quebra (L-36). Os casos de regra alteram o .htaccess da pasta E a referência,
 * para que só o critério da lista fechada reprove, não a identidade.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const VERIFICADOR = join(RAIZ, 'scripts/verificar-htaccess-pastas.ts');
const HTACCESS_REAL = join(RAIZ, 'public/.htaccess');
const LINHA_CORINGA = 'RewriteRule ^ api/portao.php [L]';
const LINHA_NUCLEO = 'RewriteRule ^api/nucleo(/|$) - [F,L]';

let tmp: string;
let dist: string;
let referencia: string;

function rodar() {
  return spawnSync(process.execPath, ['--import', 'tsx', VERIFICADOR], {
    cwd: RAIZ,
    encoding: 'utf-8',
    env: {
      ...process.env,
      DIST_PATH: dist,
      VERIFICAR_HTACCESS_REFERENCIA: referencia
    }
  });
}

function plantar(nome: string, conteudo: string | Buffer): void {
  const caminho = join(dist, nome);
  mkdirSync(join(caminho, '..'), { recursive: true });
  writeFileSync(caminho, conteudo);
}

function saida(r: { stdout: string; stderr: string }): string {
  return r.stdout + r.stderr;
}

/** Troca o mesmo texto no .htaccess da pasta e no da referência. */
function sabotarRegras(trocar: (texto: string) => string): void {
  const novo = trocar(readFileSync(HTACCESS_REAL, 'utf-8'));
  writeFileSync(join(dist, '.htaccess'), novo);
  writeFileSync(referencia, novo);
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'htaccess-pastas-'));
  dist = join(tmp, 'dist');
  mkdirSync(dist);
  referencia = join(tmp, 'referencia.htaccess');
  copyFileSync(HTACCESS_REAL, referencia);
  copyFileSync(HTACCESS_REAL, join(dist, '.htaccess'));
  for (const nome of [
    'index.html',
    'sw.js',
    'robots.txt',
    'entrada.css',
    'icones/favicon.svg',
    'api/portao.php',
    'api/saude.php',
    'api/nucleo/.htaccess',
    'api/nucleo/portao.php',
    'api/juri/imagem.php',
    'assets/app.js'
  ]) {
    plantar(nome, 'conteudo sintetico');
  }
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('portão do .htaccess e das pastas do pacote', () => {
  it('pacote certo passa e imprime divergências=0', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    expect(saida(r)).toContain('divergências=0');
  });

  it('regra liberada nova, fora da lista fechada, reprova', () => {
    sabotarRegras((t) =>
      t.replace(LINHA_CORINGA, `RewriteRule ^(manifest\\.webmanifest)$ - [L]\n${LINHA_CORINGA}`)
    );
    plantar('manifest.webmanifest', '{}');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('liberada sem portão');
  });

  it('api/nucleo sem a negação reprova (arquivo de dentro da área passaria direto)', () => {
    sabotarRegras((t) => t.replace(`${LINHA_NUCLEO}\n`, ''));
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('api/nucleo');
  });

  it('.htaccess da pasta diferente do público reprova', () => {
    writeFileSync(join(dist, '.htaccess'), `${readFileSync(HTACCESS_REAL, 'utf-8')}\n# alterado\n`);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('difere');
  });

  it('pasta de primeiro nível nova sem decisão reprova', () => {
    plantar('extra/x.txt', 'sintetico');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('pasta nova');
  });

  it('caminho liberado que sumiu da pasta reprova (robots.txt ausente)', () => {
    rmSync(join(dist, 'robots.txt'));
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('robots.txt');
  });

  it('api/nucleo/.htaccess ausente reprova', () => {
    rmSync(join(dist, 'api/nucleo/.htaccess'));
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saida(r)).toContain('api/nucleo/.htaccess');
  });

  it.each(['api/mal_nomeado.php', 'api/Maiuscula.php', 'api/juri/Imagem.php'])(
    'endpoint %s fora de api/nucleo reprova: nome fora da regex não pode virar 404 calado',
    (endpoint) => {
      plantar(endpoint, 'endpoint sintetico');
      const r = rodar();
      expect(r.status).toBe(1);
      expect(saida(r)).toContain(endpoint);
    }
  );

  it('o build chama o verificador', () => {
    const pacote = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
    };
    expect(pacote.scripts.build).toContain('scripts/verificar-htaccess-pastas.ts');
  });
});
