import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { escreverArquivos, rodarFerramenta } from './apoio/acervoFerramenta';
import { jpegSintetico, pngSintetico, webpSintetico } from './apoio/imagensSinteticas';

/**
 * scripts/publicar.sh, portão do acervo da Júri no --preparar (LU-C1, incidente de 08/11/2026).
 * Defeito: conferir_insumos só testava se imagens/ e acervo.json EXISTEM. Uma pasta cifrada antiga
 * passou nesse teste e foi enviada ao servidor. O portão novo roda o conferir da ferramenta local
 * (contrato claro) e recusa antes de qualquer commit ou virada.
 * Fixtures sintéticas: bytes aleatórios no formato cifrado; no formato claro, a própria ferramenta
 * `preparar` gera a pasta a partir de imagens sintéticas. Nada toca o servidor nem imagem real.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// PUBLICAR_SH: só este teste lê a variável, para rodar o mesmo spec contra uma cópia do script (mutação).
const FONTE = readFileSync(process.env.PUBLICAR_SH ?? join(RAIZ, 'scripts/publicar.sh'), 'utf-8');
const FUNCOES = ['recusar', 'conferir_acervo_claro', 'conferir_insumos'];
const LONGO = 180_000;
const QUANTIDADE_CIFRADA = 14;

let tmp: string;
let chave: string;
let caixaFalsa: string;
let restrito: string;
let cifrado: string;
let claro: string;

/** Corpo da função do publicar.sh; vazio se ela ainda não existe (o caso então falha pelo comportamento). */
function funcao(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  return m ? m[0] : '';
}

/** Pasta no formato cifrado antigo: 14 arquivos <id>.juri de bytes aleatórios e acervo.json com kid. */
function fixtureCifrada(): string {
  const pasta = join(tmp, 'cifrado');
  mkdirSync(join(pasta, 'imagens'), { recursive: true });
  const indice: { id: string; tipo: string; bytes: number; sha256: string }[] = [];
  for (let i = 1; i <= QUANTIDADE_CIFRADA; i++) {
    const id = i.toString(16).padStart(32, '0');
    const bytes = randomBytes(64 + i);
    writeFileSync(join(pasta, 'imagens', `${id}.juri`), bytes);
    indice.push({
      id,
      tipo: 'jpeg',
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex')
    });
  }
  writeFileSync(join(pasta, 'acervo.json'), JSON.stringify({ kid: 'k-sintetico', indice }));
  return pasta;
}

/** Pasta no formato claro, gerada pela própria ferramenta preparar a partir de três imagens sintéticas. */
async function fixtureClara(): Promise<string> {
  const origem = join(tmp, 'originais');
  mkdirSync(origem, { mode: 0o700 });
  escreverArquivos(origem, {
    'a.png': pngSintetico(),
    'b.jpg': jpegSintetico(3),
    'c.webp': webpSintetico()
  });
  const saida = join(tmp, 'claro');
  const r = await rodarFerramenta(['preparar', '--originais', origem, '--saida', saida]);
  if (r.codigo !== 0) {
    throw new Error(`preparar sintético falhou (código ${r.codigo}): ${r.stderr}`);
  }
  return saida;
}

/** Roda conferir_insumos em modo --preparar com o acervo dado, pelas funções reais do publicar.sh. */
function rodarConferirInsumos(acervo: string): { status: number | null; saida: string } {
  const script = [
    'set -euo pipefail',
    `RAIZ='${RAIZ}'`,
    `ESPACO='${join(tmp, 'espaco')}'`,
    'mkdir -p "$ESPACO"',
    `CHAVE_GIT_CRYPT='${chave}'`,
    `CADERNO_CAIXA='${caixaFalsa}'`,
    'MODO=preparar',
    `CADERNO_ACERVO_JURI='${acervo}'`,
    `CADERNO_RESTRITO_JURI='${restrito}'`,
    ...FUNCOES.map(funcao),
    'conferir_insumos',
    'echo passou'
  ].join('\n');
  const r = spawnSync('bash', ['-c', script], { encoding: 'utf-8', timeout: LONGO });
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

beforeAll(async () => {
  tmp = mkdtempSync(join(process.env.TMPDIR ?? '/var/tmp', 'acervo-claro-'));
  chave = join(tmp, 'chave-git-crypt.key');
  writeFileSync(chave, 'chave-sintetica');
  caixaFalsa = join(tmp, 'caixa-falsa.sh');
  writeFileSync(caixaFalsa, '#!/bin/sh\nexit 0\n');
  chmodSync(caixaFalsa, 0o755);
  restrito = join(tmp, 'juri.json');
  writeFileSync(restrito, '{}');
  cifrado = fixtureCifrada();
  claro = await fixtureClara();
}, LONGO);

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('publicar.sh: acervo da Júri no formato claro antes do --preparar (LU-C1)', () => {
  it('recusa acervo cifrado (14 .juri e kid) com "acervo fora do formato claro", sem seguir', () => {
    const r = rodarConferirInsumos(cifrado);
    expect(r.status, r.saida).not.toBe(0);
    expect(r.saida, r.saida).toContain('acervo fora do formato claro');
    expect(r.saida, r.saida).not.toContain('passou');
  }, LONGO);

  it('aceita acervo claro: roda o conferir da ferramenta local e segue', () => {
    const r = rodarConferirInsumos(claro);
    expect(r.status, r.saida).toBe(0);
    expect(r.saida, r.saida).toContain('conferido: 3 imagens');
    expect(r.saida, r.saida).toContain('passou');
  }, LONGO);
});
