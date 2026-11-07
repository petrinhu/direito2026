import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_ESPERADO, WEBROOT_ESPERADO, plantar, plantarDist } from './apoio/pacoteSintetico';

/**
 * Separador do pacote (scripts/separar-pacote.ts, LU-F4.2, plano 1.1 e 7.1). Cada
 * caso planta um dist sintético e prova o critério que a sabotagem quebra (L-36).
 * Toda asserção negativa confere também a MENSAGEM da razão: rc 1 sozinho pode vir
 * de um script ausente e não provaria nada.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SEPARADOR = join(RAIZ, 'scripts/separar-pacote.ts');
const BUILD = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf-8')) as {
  scripts: Record<string, string>;
};

let tmp: string;
let dist: string;
let saida: string;

function rodar(distCaminho: string = dist, saidaCaminho: string = saida) {
  return spawnSync(process.execPath, ['--import', 'tsx', SEPARADOR], {
    cwd: RAIZ,
    encoding: 'utf-8',
    env: { ...process.env, DIST_PATH: distCaminho, PACOTE_SAIDA: saidaCaminho }
  });
}

function saidaCompleta(r: { stdout: string; stderr: string }): string {
  return r.stdout + r.stderr;
}

/** Caminhos relativos (com `/`) de todos os arquivos de uma pasta, ordenados. */
function listar(pasta: string, base: string = pasta): string[] {
  return readdirSync(pasta, { withFileTypes: true })
    .flatMap((entrada) => {
      const caminho = join(pasta, entrada.name);
      if (entrada.isDirectory()) return listar(caminho, base);
      return [relative(base, caminho).split(sep).join('/')];
    })
    .sort();
}

function md5(caminho: string): string {
  return createHash('md5').update(readFileSync(caminho)).digest('hex');
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'separar-pacote-'));
  dist = join(tmp, 'dist');
  saida = join(tmp, 'saida');
  plantarDist(dist);
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('separador do pacote', () => {
  it('webroot recebe só a lista fechada; app recebe o resto', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    expect(listar(join(saida, 'webroot'))).toEqual([...WEBROOT_ESPERADO].sort());
    expect(listar(join(saida, 'app'))).toEqual(['manifesto.json', ...APP_ESPERADO].sort());
  });

  it('manifesto cobre só o app, sem ele mesmo, com tipo, bytes e md5 certos', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    const manifesto = JSON.parse(
      readFileSync(join(saida, 'app/manifesto.json'), 'utf-8')
    ) as Record<string, { tipo: string; bytes: number; md5: string }>;
    expect(Object.keys(manifesto).sort()).toEqual([...APP_ESPERADO].sort());
    for (const caminho of APP_ESPERADO) {
      const entrada = manifesto[caminho];
      expect(Object.keys(entrada ?? {}).sort()).toEqual(['bytes', 'md5', 'tipo']);
      expect(entrada?.md5).toBe(md5(join(saida, 'app', caminho)));
      expect(entrada?.bytes).toBe(statSync(join(saida, 'app', caminho)).size);
    }
    expect(manifesto['index.html']?.tipo).toBe('text/html');
    expect(manifesto['assets/busca-indice.json']?.tipo).toBe('application/json');
    expect(manifesto['assets/fonte-abc123.woff2']?.tipo).toBe('font/woff2');
  });

  it('saída informa a contagem da varredura e falharam=0', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    expect(saidaCompleta(r)).toContain(
      `encontrados=${WEBROOT_ESPERADO.length + APP_ESPERADO.length} analisados=${WEBROOT_ESPERADO.length + APP_ESPERADO.length} falharam=0`
    );
  });

  it.each([
    ['assets/x.zzz', 'extensão não prevista'],
    ['assets/x.js.map', 'extensão não prevista'],
    ['assets/x.php', 'extensão não prevista'],
    ['404.html', '404 estático saiu'],
    ['manifesto.json', 'nome reservado'],
    ['api/nucleo/notas.txt', 'api fora da regra']
  ])('%s no dist reprova com a razão, sem escrever nada', (arquivo, razao) => {
    plantar(dist, arquivo, 'sintetico');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain(razao);
    expect(existsSync(join(saida, 'webroot'))).toBe(false);
    expect(existsSync(join(saida, 'app'))).toBe(false);
  });

  it.each(['.htaccess', 'sw.js', 'robots.txt', 'api/nucleo/.htaccess', 'index.html'])(
    'sem %s o separador reprova e nomeia o que falta',
    (arquivo) => {
      rmSync(join(dist, arquivo));
      const r = rodar();
      expect(r.status).toBe(1);
      expect(saidaCompleta(r)).toContain(arquivo);
    }
  );

  it('dist vazio reprova (piso de varredura, L-36)', () => {
    rmSync(dist, { recursive: true, force: true });
    mkdirSync(dist);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('encontrados=0');
  });

  it('dist ausente reprova (falha fechada)', () => {
    const r = rodar(join(tmp, 'nao-existe'));
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('pasta ausente');
  });

  it('saída igual ao dist reprova e não apaga o dist', () => {
    const r = rodar(dist, dist);
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('saída não pode ser o dist');
    expect(existsSync(join(dist, 'index.html'))).toBe(true);
  });

  it('nova execução limpa a saída anterior (sem arquivo velho sobrando)', () => {
    plantar(saida, 'app/velho.js', 'antigo');
    plantar(saida, 'webroot/assets/velho.js', 'antigo');
    const r = rodar();
    expect(r.status).toBe(0);
    expect(existsSync(join(saida, 'app/velho.js'))).toBe(false);
    expect(existsSync(join(saida, 'webroot/assets/velho.js'))).toBe(false);
  });

  it('o build separa o pacote entre o vite build e o portão da Júri, sem cp 404', () => {
    const build = BUILD.scripts.build ?? '';
    expect(build).not.toContain('dist/404.html');
    const posVite = build.indexOf('vite build');
    const posSeparar = build.indexOf('scripts/separar-pacote.ts');
    const posJuri = build.indexOf('scripts/verificar-juri-fora-do-pacote.ts');
    expect(posVite).toBeGreaterThan(-1);
    expect(posSeparar).toBeGreaterThan(posVite);
    expect(posJuri).toBeGreaterThan(posSeparar);
    expect(build).toContain('VERIFICAR_JURI_PACOTES=dist-pacote/webroot,dist-pacote/app');
  });
});
