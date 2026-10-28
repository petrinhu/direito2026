import { ErroCifra } from './erroCifra';

/*
 * Formato v1 da imagem cifrada (pesquisa §4.2). Regra de bytes, sem criptografia:
 *   0..3 magic "JURI" | 4 versão 0x01 | 5 algoritmo 0x01 (AES-256-GCM) | 6 tipo |
 *   7 reservado 0x00 | 8..23 kid | 24..39 id | 40..51 IV | 52.. ciphertext || tag (16).
 * Os 52 bytes do cabeçalho são o AAD. A leitura valida tudo ANTES de decifrar.
 */

export const TAMANHO_CABECALHO = 52;
export const TAMANHO_TAG = 16;
export const TAMANHO_KID = 16;
export const TAMANHO_ID = 16;
export const TAMANHO_IV = 12;

export type TipoImagem = 'jpeg' | 'png' | 'webp';

const MAGIC = [0x4a, 0x55, 0x52, 0x49];
const VERSAO = 1;
const ALGORITMO_AES_256_GCM = 1;
const RESERVADO = 0;

const BYTE_DO_TIPO: Record<TipoImagem, number> = { jpeg: 1, png: 2, webp: 3 };
const TIPO_DO_BYTE = new Map<number, TipoImagem>(
  (Object.entries(BYTE_DO_TIPO) as [TipoImagem, number][]).map(([tipo, byte]) => [byte, tipo])
);

export interface CamposCabecalho {
  kid: Uint8Array<ArrayBuffer>;
  id: Uint8Array<ArrayBuffer>;
  tipo: TipoImagem;
  iv: Uint8Array<ArrayBuffer>;
}

export interface ArquivoLido {
  tipo: TipoImagem;
  /** Os 52 bytes do cabeçalho: é o AAD da decifração, sem cópia nem reconstrução. */
  cabecalho: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  /** ciphertext || tag, exatamente como o WebCrypto espera. */
  ciphertextETag: Uint8Array<ArrayBuffer>;
}

export function montarCabecalho(campos: CamposCabecalho): Uint8Array<ArrayBuffer> {
  const cabecalho = new Uint8Array(TAMANHO_CABECALHO);
  cabecalho.set(MAGIC, 0);
  cabecalho[4] = VERSAO;
  cabecalho[5] = ALGORITMO_AES_256_GCM;
  cabecalho[6] = BYTE_DO_TIPO[campos.tipo];
  cabecalho[7] = RESERVADO;
  cabecalho.set(campos.kid, 8);
  cabecalho.set(campos.id, 24);
  cabecalho.set(campos.iv, 40);
  return cabecalho;
}

/**
 * Valida o arquivo inteiro contra o formato v1, o kid e o id pedidos; não decifra nada.
 * O id é checado aqui porque o AAD sozinho não basta: um arquivo de outra imagem do mesmo
 * acervo traz cabeçalho próprio e consistente consigo mesmo.
 */
export function lerArquivo(
  arquivo: Uint8Array<ArrayBuffer>,
  kidEsperado: Uint8Array<ArrayBuffer>,
  idEsperado: Uint8Array<ArrayBuffer>
): ArquivoLido {
  if (arquivo.byteLength < TAMANHO_CABECALHO + TAMANHO_TAG) {
    throw new ErroCifra('tamanho');
  }
  const cabecalho = arquivo.subarray(0, TAMANHO_CABECALHO);
  if (!iguais(cabecalho.subarray(0, 4), MAGIC)) {
    throw new ErroCifra('formato');
  }
  if (cabecalho[4] !== VERSAO) {
    throw new ErroCifra('versao');
  }
  if (cabecalho[5] !== ALGORITMO_AES_256_GCM) {
    throw new ErroCifra('algoritmo');
  }
  const tipo = TIPO_DO_BYTE.get(cabecalho[6] ?? -1);
  if (tipo === undefined) {
    throw new ErroCifra('tipo');
  }
  if (cabecalho[7] !== RESERVADO) {
    throw new ErroCifra('reservado');
  }
  if (!iguais(cabecalho.subarray(8, 24), kidEsperado)) {
    throw new ErroCifra('kid');
  }
  if (!iguais(cabecalho.subarray(24, 40), idEsperado)) {
    throw new ErroCifra('id');
  }
  return {
    tipo,
    cabecalho,
    iv: cabecalho.subarray(40, 52),
    ciphertextETag: arquivo.subarray(TAMANHO_CABECALHO)
  };
}

function iguais(a: Uint8Array, b: ArrayLike<number>): boolean {
  if (a.byteLength !== b.length) {
    return false;
  }
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
