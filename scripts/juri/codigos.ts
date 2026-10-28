import { createHash, randomBytes } from 'node:crypto';

/** Conversões de bytes usadas pela ferramenta. Entrada validada antes de chegar aqui. */

export function bytesParaHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

export function hexParaBytes(hex: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Bytes aleatórios do CSPRNG do sistema (kid, salt, id). */
export function aleatorios(tamanho: number): Uint8Array<ArrayBuffer> {
  return new Uint8Array(randomBytes(tamanho));
}

/** Id do acervo: 16 bytes aleatórios em hex minúsculo (32 caracteres). */
export function idAleatorio(): string {
  return bytesParaHex(aleatorios(16));
}
