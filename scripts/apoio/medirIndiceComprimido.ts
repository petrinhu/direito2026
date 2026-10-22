import { gzipSync } from 'node:zlib';

/**
 * Tamanho do índice de busca comprimido com gzip nível 9, em bytes. É o
 * número que o portão RI6 (docs/arquitetura.md, seção 7) compara com o teto
 * de 300 KB, porque o teto foi escrito como "comprimido". Fica fora de
 * src/core porque usa node:zlib (Node-only); a validação em si é pura.
 */
export function medirTamanhoComprimido(json: string): number {
  return gzipSync(Buffer.from(json, 'utf-8'), { level: 9 }).byteLength;
}
