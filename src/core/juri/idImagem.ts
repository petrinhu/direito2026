import { ErroCifra } from './erroCifra';
import { TAMANHO_ID } from './formatoImagem';

/** Id do acervo: 32 hex minúsculos, o nome do arquivo `imagens/<id>` no servidor. */
const ID_HEX = /^[0-9a-f]{32}$/;

/** Verdadeiro só para o formato exato do id (nunca aproximado). */
export function ehIdImagem(valor: unknown): valor is string {
  return typeof valor === 'string' && ID_HEX.test(valor);
}

/**
 * Converte o id hex nos 16 bytes do cabeçalho do formato v1. Só a ferramenta de acervo
 * (scripts/juri) usa isto, até a F4.1 reescrevê-la; o navegador não cifra mais nada.
 */
export function idDeHex(id: string): Uint8Array<ArrayBuffer> {
  if (!ehIdImagem(id)) {
    throw new ErroCifra('entrada');
  }
  const bytes = new Uint8Array(TAMANHO_ID);
  for (let i = 0; i < TAMANHO_ID; i++) {
    bytes[i] = parseInt(id.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
