/**
 * Apoio dos testes de cifra da Júri: conversões de bytes para os vetores e
 * adulterações de um byte. Só existe em teste; nada aqui vai para src.
 */
import { ErroCifra } from '@/core/juri/cifra';

export function hexParaBytes(hex: string): Uint8Array<ArrayBuffer> {
  const limpo = hex.replace(/\s+/g, '').replace(/^0x/, '');
  const bytes = new Uint8Array(limpo.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(limpo.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesParaHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function utf8(texto: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new globalThis.TextEncoder().encode(texto));
}

export function b64ParaBytes(texto: string): Uint8Array<ArrayBuffer> {
  const binario = globalThis.atob(texto);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

export function bytesParaB64(bytes: Uint8Array): string {
  let binario = '';
  for (const b of bytes) {
    binario += String.fromCharCode(b);
  }
  return globalThis.btoa(binario);
}

/** Cópia com o byte da posição `indice` trocado por `valor`. */
export function comByte(
  bytes: Uint8Array<ArrayBuffer>,
  indice: number,
  valor: number
): Uint8Array<ArrayBuffer> {
  const copia = bytes.slice();
  copia[indice] = valor;
  return copia;
}

/** Cópia com 1 bit invertido na posição `indice` (o menor deslocamento possível). */
export function bitInvertido(
  bytes: Uint8Array<ArrayBuffer>,
  indice: number
): Uint8Array<ArrayBuffer> {
  const atual = bytes[indice];
  if (atual === undefined) {
    throw new Error(`índice ${indice} fora do arquivo de ${bytes.byteLength} bytes`);
  }
  return comByte(bytes, indice, atual ^ 0x01);
}

/**
 * Espera uma falha e devolve o ErroCifra, para o teste conferir o código dele.
 * Falha que não seja ErroCifra (ex.: OperationError cru do WebCrypto) reprova:
 * o erro limpo é exigência, não detalhe.
 */
export async function erroCifraDe(promessa: Promise<unknown>): Promise<ErroCifra> {
  try {
    await promessa;
  } catch (erro) {
    if (erro instanceof ErroCifra) return erro;
    throw erro;
  }
  throw new Error('esperava ErroCifra e a operação terminou com sucesso');
}

/**
 * Nome da falha do WebCrypto (ex.: InvalidAccessError). O name do DOMException é
 * getter do protótipo, então toMatchObject não o enxerga: lê-se aqui, explícito.
 */
export async function nomeDaFalha(promessa: Promise<unknown>): Promise<string> {
  try {
    await promessa;
  } catch (erro) {
    return (erro as { name?: string }).name ?? 'sem-nome';
  }
  return 'sucesso';
}
