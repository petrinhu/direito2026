import { ErroCifra } from './erroCifra';

/** Base64 padrão (não URL) para os campos iv e ct do embrulho. */
export function bytesParaBase64(bytes: Uint8Array): string {
  let binario = '';
  for (const byte of bytes) {
    binario += String.fromCharCode(byte);
  }
  return globalThis.btoa(binario);
}

export function base64ParaBytes(texto: string): Uint8Array<ArrayBuffer> {
  let binario: string;
  try {
    binario = globalThis.atob(texto);
  } catch {
    throw new ErroCifra('formato');
  }
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}
