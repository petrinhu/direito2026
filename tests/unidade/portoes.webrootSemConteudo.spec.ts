import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WEBROOT_ESPERADO, plantar } from './apoio/pacoteSintetico';

/**
 * Portão do webroot (scripts/verificar-webroot-sem-conteudo.ts, LU-F4.2, plano 7.3).
 * Cada caso planta um webroot sintético e prova o critério da sabotagem (L-36).
 * Os termos e os trechos são inventados: nenhum conteúdo real entra no teste.
 * O portão nunca imprime o termo (L-28): o caso de termo confere isso.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const VERIFICADOR = join(RAIZ, 'scripts/verificar-webroot-sem-conteudo.ts');
const TERMO_SINTETICO = 'Termo Sintetico Proibido';
const TRECHO_SINTETICO = 'Frase de estudo sintetica com mais de quarenta caracteres para o teste.';

let tmp: string;
let webroot: string;
let termos: string;
let conteudo: string;

function rodar(extra: Record<string, string | undefined> = {}) {
  return spawnSync(process.execPath, ['--import', 'tsx', VERIFICADOR], {
    cwd: RAIZ,
    encoding: 'utf-8',
    env: {
      ...process.env,
      WEBROOT_PATH: webroot,
      VERIFICAR_PROIBICOES_TERMOS: termos,
      CONTEUDO_PATH: conteudo,
      ...extra
    }
  });
}

function saidaCompleta(r: { stdout: string; stderr: string }): string {
  return r.stdout + r.stderr;
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'webroot-sem-conteudo-'));
  webroot = join(tmp, 'webroot');
  termos = join(tmp, 'termos.txt');
  conteudo = join(tmp, 'conteudo');
  for (const caminho of WEBROOT_ESPERADO) plantar(webroot, caminho, `sintetico ${caminho}\n`);
  writeFileSync(termos, `${TERMO_SINTETICO}\n`);
  mkdirSync(join(conteudo, 'p1'), { recursive: true });
  writeFileSync(
    join(conteudo, 'p1/unidade.ts'),
    "export const texto = 'Texto de estudo que nao aparece no webroot, com mais de quarenta.';\n"
  );
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('portão do webroot sem conteúdo', () => {
  it('webroot com só a lista fechada passa e imprime a contagem', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    expect(saidaCompleta(r)).toContain(
      `encontrados=${WEBROOT_ESPERADO.length} analisados=${WEBROOT_ESPERADO.length} falharam=0`
    );
  });

  it('sabotagem: assets/x.js no webroot reprova, com o caminho nomeado', () => {
    plantar(webroot, 'assets/x.js', 'console.log("sintetico");');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('assets/x.js');
    expect(saidaCompleta(r)).toContain('fora da lista');
  });

  it('extensão nova no webroot reprova', () => {
    plantar(webroot, 'api/novo.zzz', 'sintetico');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('api/novo.zzz');
  });

  it('webroot sem sw.js reprova (item obrigatório)', () => {
    rmSync(join(webroot, 'sw.js'));
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('sw.js');
  });

  it('webroot vazio reprova (piso de varredura, L-36)', () => {
    rmSync(webroot, { recursive: true, force: true });
    mkdirSync(webroot);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('encontrados=0');
  });

  it('termo proibido no webroot reprova, sem imprimir o termo', () => {
    plantar(webroot, 'api/saude.php', `<?php // ${TERMO_SINTETICO.toUpperCase()}\n`);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('api/saude.php');
    expect(saidaCompleta(r)).not.toContain(TERMO_SINTETICO);
    expect(saidaCompleta(r)).not.toContain(TERMO_SINTETICO.toLowerCase());
  });

  it('arquivo de termos ausente reprova (falha fechada, não passa em silêncio)', () => {
    const r = rodar({ VERIFICAR_PROIBICOES_TERMOS: join(tmp, 'nao-existe.txt') });
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('termos');
  });

  it('trecho de src/conteudo no webroot reprova', () => {
    plantar(webroot, 'api/saude.php', `<?php // ${TRECHO_SINTETICO}\n`);
    writeFileSync(join(conteudo, 'p1/unidade.ts'), `export const texto = '${TRECHO_SINTETICO}';\n`);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('trecho de conteúdo');
  });

  it('src/conteudo sem nenhum literal reprova (piso do trecho)', () => {
    rmSync(join(conteudo, 'p1'), { recursive: true, force: true });
    mkdirSync(join(conteudo, 'vazio'), { recursive: true });
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('trechos de conteúdo=0');
  });

  it('webroot ausente reprova (falha fechada)', () => {
    const r = rodar({ WEBROOT_PATH: join(tmp, 'nao-existe') });
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('pasta ausente');
  });
});
