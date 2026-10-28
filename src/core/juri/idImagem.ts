import { ErroCifra } from './erroCifra';
import { TAMANHO_CABECALHO, TAMANHO_ID, TAMANHO_KID, TAMANHO_TAG } from './formatoImagem';

/** Id do acervo: 32 hex minúsculos, o nome do arquivo `imagens/<id>.juri` (formato v1, §4.2). */
const ID_HEX = /^[0-9a-f]{32}$/;
const INICIO_KID = 8;

/** Verdadeiro só para o formato exato do id (nunca aproximado). */
export function ehIdImagem(valor: unknown): valor is string {
  return typeof valor === 'string' && ID_HEX.test(valor);
}

/** Converte o id hex nos 16 bytes que o cabeçalho guarda. Id fora do formato é erro de entrada. */
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

/**
 * Lê o kid dos bytes 8 a 23 do próprio arquivo. A API não entrega o kid ao navegador
 * (contrato do plano do CTO, §1; kid só existe em acervo.json), então a checagem de kid
 * da decifração vira tautologia: o arquivo confere consigo mesmo. A integridade fica com
 * o AES-GCM, que usa o cabeçalho inteiro (kid incluso) como AAD. Ver a lacuna no TODO.md.
 */
export function kidDoArquivo(arquivo: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  if (arquivo.byteLength < TAMANHO_CABECALHO + TAMANHO_TAG) {
    throw new ErroCifra('tamanho');
  }
  return arquivo.slice(INICIO_KID, INICIO_KID + TAMANHO_KID);
}
