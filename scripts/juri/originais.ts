import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { TipoImagem } from '../../src/core/juri/formatoImagem';
import { sha256Hex } from './codigos';
import { ErroFerramenta } from './erro';
import { NOME_IDS } from './idsTsv';

export interface Original {
  /** Nome do arquivo: fica só em memória e no ids.tsv da pasta de originais, nunca numa mensagem. */
  nome: string;
  bytes: Uint8Array<ArrayBuffer>;
  tipo: TipoImagem;
  sha256: string;
}

const ASSINATURA_PNG = [137, 80, 78, 71, 13, 10, 26, 10];

function textoEm(bytes: Uint8Array, inicio: number, tamanho: number): string {
  return Buffer.from(bytes.subarray(inicio, inicio + tamanho)).toString('latin1');
}

/** Tipo pelo conteúdo (bytes de início), nunca pela extensão. Desconhecido vira null. */
export function detectarTipo(bytes: Uint8Array): TipoImagem | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }
  if (bytes.length >= 8 && ASSINATURA_PNG.every((byte, i) => bytes[i] === byte)) {
    return 'png';
  }
  if (bytes.length >= 12 && textoEm(bytes, 0, 4) === 'RIFF' && textoEm(bytes, 8, 4) === 'WEBP') {
    return 'webp';
  }
  return null;
}

/**
 * Lê a pasta de originais. Só arquivo regular de imagem entra: pasta, atalho, PDF e qualquer
 * outra coisa recusam a rodada inteira (fail-closed), sem nomear o arquivo na mensagem.
 * O ids.tsv da própria pasta é ignorado por ser nosso.
 */
export function listarOriginais(pasta: string): Original[] {
  const entradas = readdirSync(pasta, { withFileTypes: true })
    .filter((entrada) => entrada.name !== NOME_IDS)
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const originais: Original[] = [];
  let recusadas = 0;
  for (const entrada of entradas) {
    if (!entrada.isFile()) {
      recusadas++;
      continue;
    }
    const bytes = new Uint8Array(readFileSync(join(pasta, entrada.name)));
    const tipo = detectarTipo(bytes);
    if (tipo === null) {
      recusadas++;
      continue;
    }
    originais.push({ nome: entrada.name, bytes, tipo, sha256: sha256Hex(bytes) });
  }
  if (recusadas > 0) {
    throw new ErroFerramenta(
      `${recusadas} entrada(s) em originais não é imagem jpeg, png ou webp (PDF, pasta e atalho não entram; extraia as imagens antes)`
    );
  }
  if (originais.length === 0) {
    throw new ErroFerramenta('originais sem nenhuma imagem');
  }
  return originais;
}
