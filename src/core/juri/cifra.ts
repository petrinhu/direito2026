import { base64ParaBytes, bytesParaBase64 } from './base64';
import { ErroCifra } from './erroCifra';
import {
  TAMANHO_ID,
  TAMANHO_IV,
  TAMANHO_KID,
  TAMANHO_TAG,
  lerArquivo,
  montarCabecalho,
  type TipoImagem
} from './formatoImagem';

export { ErroCifra } from './erroCifra';
export type { CodigoErroCifra } from './erroCifra';
export type { TipoImagem } from './formatoImagem';

/** CEK e KEK: chaves AES-GCM do WebCrypto. Alias único porque o lint do projeto não conhece o tipo global. */
type ChaveAesGcm = globalThis.CryptoKey;

/** Piso da OWASP para PBKDF2-HMAC-SHA256 (pesquisa §3.3). Fonte única: sal.php devolve este valor. */
export const ITERACOES_PBKDF2 = 600000;
export const TAMANHO_SALT = 16;
/** Rótulos HKDF do documento (pesquisa §2). Mudar um deles muda todas as chaves: é versão nova. */
export const ROTULO_KEK = 'juri-kek-v1';
export const ROTULO_AUTH = 'juri-auth-v1';

const VERSAO_EMBRULHO = 1;
const TAMANHO_IV_EMBRULHO = 12;
const BITS_TAG = 128;
const SEM_SALT = new Uint8Array(0);
const SUBTLE = globalThis.crypto.subtle;

export interface Embrulho {
  v: number;
  iv: string;
  ct: string;
}

export interface DerivacaoUsuario {
  /** Não extraível, com usos wrapKey e unwrapKey: só embrulha e desembrulha a CEK. */
  kek: ChaveAesGcm;
  /** 32 bytes enviados ao servidor no login. Nunca viram KEK. */
  auth: Uint8Array<ArrayBuffer>;
}

export interface OpcoesDesembrulho {
  /**
   * Só quem vai REEMBRULHAR a CEK (troca de senha, criação ou redefinição) pede true.
   * Uso normal de leitura fica com o padrão false (pesquisa §5.3).
   */
  extraivel?: boolean;
}

export interface MetaImagem {
  kid: Uint8Array<ArrayBuffer>;
  id: Uint8Array<ArrayBuffer>;
  tipo: TipoImagem;
}

export interface ImagemDecifrada {
  tipo: TipoImagem;
  bytes: Uint8Array<ArrayBuffer>;
}

/** PBKDF2-HMAC-SHA256 com saída em bytes. Primitiva pura: os vetores da RFC 7914 testam esta função. */
export async function pbkdf2Bits(
  senha: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
  iteracoes: number,
  bits: number
): Promise<Uint8Array<ArrayBuffer>> {
  const base = await SUBTLE.importKey('raw', senha, 'PBKDF2', false, ['deriveBits']);
  const bruto = await SUBTLE.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iteracoes },
    base,
    bits
  );
  return new Uint8Array(bruto);
}

/** HKDF-SHA256 com saída em bytes. O WebCrypto não expõe o PRK, só o OKM. */
export async function hkdfBits(
  ikm: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
  info: Uint8Array<ArrayBuffer>,
  bits: number
): Promise<Uint8Array<ArrayBuffer>> {
  const base = await SUBTLE.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bruto = await SUBTLE.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, base, bits);
  return new Uint8Array(bruto);
}

/**
 * Deriva a KEK (para embrulhar a CEK) e o AUTH (para o login) a partir da senha.
 * MK = PBKDF2(senha, salt); KEK = HKDF(MK, ROTULO_KEK); AUTH = HKDF(MK, ROTULO_AUTH).
 * O documento não fixa salt do HKDF: usa-se o salt vazio (equivale a zeros, RFC 5869 §2.2).
 */
export async function derivar(
  senha: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<DerivacaoUsuario> {
  if (salt.byteLength !== TAMANHO_SALT) {
    throw new ErroCifra('entrada');
  }
  const mestre = await pbkdf2Bits(
    new Uint8Array(new globalThis.TextEncoder().encode(senha)),
    salt,
    ITERACOES_PBKDF2,
    256
  );
  const chaveMestra = await SUBTLE.importKey('raw', mestre, 'HKDF', false, [
    'deriveBits',
    'deriveKey'
  ]);
  mestre.fill(0);

  const auth = new Uint8Array(
    await SUBTLE.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: SEM_SALT, info: utf8(ROTULO_AUTH) },
      chaveMestra,
      256
    )
  );
  const kek = await SUBTLE.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: SEM_SALT, info: utf8(ROTULO_KEK) },
    chaveMestra,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
  return { kek, auth };
}

/**
 * CEK de 256 bits. Nasce extraível porque o único uso dela é ser embrulhada logo
 * depois (wrapKey recusa chave não extraível).
 */
export function gerarCek(): Promise<ChaveAesGcm> {
  return SUBTLE.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export async function embrulharCek(
  cek: ChaveAesGcm,
  kek: ChaveAesGcm,
  aad: Uint8Array<ArrayBuffer>
): Promise<Embrulho> {
  const iv = gerarIv(TAMANHO_IV_EMBRULHO);
  const ct = await SUBTLE.wrapKey('raw', cek, kek, {
    name: 'AES-GCM',
    iv,
    additionalData: aad,
    tagLength: BITS_TAG
  });
  return {
    v: VERSAO_EMBRULHO,
    iv: bytesParaBase64(iv),
    ct: bytesParaBase64(new Uint8Array(ct))
  };
}

export async function desembrulharCek(
  embrulho: Embrulho,
  kek: ChaveAesGcm,
  aad: Uint8Array<ArrayBuffer>,
  opcoes: OpcoesDesembrulho = {}
): Promise<ChaveAesGcm> {
  if (embrulho.v !== VERSAO_EMBRULHO) {
    throw new ErroCifra('versao');
  }
  const iv = base64ParaBytes(embrulho.iv);
  const ct = base64ParaBytes(embrulho.ct);
  if (iv.byteLength !== TAMANHO_IV_EMBRULHO || ct.byteLength < TAMANHO_TAG) {
    throw new ErroCifra('formato');
  }
  try {
    return await SUBTLE.unwrapKey(
      'raw',
      ct,
      kek,
      { name: 'AES-GCM', iv, additionalData: aad, tagLength: BITS_TAG },
      { name: 'AES-GCM', length: 256 },
      opcoes.extraivel ?? false,
      ['encrypt', 'decrypt']
    );
  } catch {
    // Chave errada (senha errada depois do login aceito), AAD trocado ou byte adulterado.
    throw new ErroCifra('integridade');
  }
}

export async function cifrarImagem(
  bytes: Uint8Array<ArrayBuffer>,
  cek: ChaveAesGcm,
  meta: MetaImagem
): Promise<Uint8Array<ArrayBuffer>> {
  if (meta.kid.byteLength !== TAMANHO_KID || meta.id.byteLength !== TAMANHO_ID) {
    throw new ErroCifra('entrada');
  }
  const iv = gerarIv(TAMANHO_IV);
  const cabecalho = montarCabecalho({ kid: meta.kid, id: meta.id, tipo: meta.tipo, iv });
  const cifrado = new Uint8Array(
    await SUBTLE.encrypt(
      { name: 'AES-GCM', iv, additionalData: cabecalho, tagLength: BITS_TAG },
      cek,
      bytes
    )
  );
  const saida = new Uint8Array(cabecalho.byteLength + cifrado.byteLength);
  saida.set(cabecalho, 0);
  saida.set(cifrado, cabecalho.byteLength);
  return saida;
}

export async function decifrarImagem(
  arquivo: Uint8Array<ArrayBuffer>,
  cek: ChaveAesGcm,
  kidEsperado: Uint8Array<ArrayBuffer>
): Promise<ImagemDecifrada> {
  if (kidEsperado.byteLength !== TAMANHO_KID) {
    throw new ErroCifra('entrada');
  }
  // Tudo que pode ser checado sem chave é checado aqui, antes de qualquer decrypt.
  const lido = lerArquivo(arquivo, kidEsperado);
  try {
    const claro = await SUBTLE.decrypt(
      { name: 'AES-GCM', iv: lido.iv, additionalData: lido.cabecalho, tagLength: BITS_TAG },
      cek,
      lido.ciphertextETag
    );
    return { tipo: lido.tipo, bytes: new Uint8Array(claro) };
  } catch {
    throw new ErroCifra('integridade');
  }
}

function gerarIv(tamanho: number): Uint8Array<ArrayBuffer> {
  const iv = new Uint8Array(tamanho);
  globalThis.crypto.getRandomValues(iv);
  return iv;
}

function utf8(texto: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new globalThis.TextEncoder().encode(texto));
}
