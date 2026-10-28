import { base64ParaBytes, bytesParaBase64 } from '../../src/core/juri/base64';
import { ehIdImagem } from '../../src/core/juri/idImagem';
import type { TipoImagem } from '../../src/core/juri/formatoImagem';
import { ErroFerramenta } from './erro';

/*
 * Formas exatas dos dois arquivos que a ferramenta grava e a conferência relê. O contrato
 * é o de servidor/cli/juri-instalar.php (credencial) e de public/api/juri/imagem.php (índice).
 */

export const LOGIN_ADMIN = 'admin';
const TIPOS: readonly TipoImagem[] = ['jpeg', 'png', 'webp'];
const RE_B64 = /^[A-Za-z0-9+/]+={0,2}$/;
const RE_AUTH = /^[A-Za-z0-9_-]{43}$/;
const RE_KID = /^[0-9a-f]{32}$/;

export interface CredencialAdmin {
  login: string;
  salt: string;
  auth: string;
  embrulho: { v: number; iv: string; ct: string };
}

export interface EntradaAcervo {
  id: string;
  tipo: TipoImagem;
  bytes: number;
}

export interface Acervo {
  kid: string;
  indice: EntradaAcervo[];
}

type Objeto = Record<string, unknown>;

function objetoSimples(valor: unknown, rotulo: string): Objeto {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new ErroFerramenta(`${rotulo} precisa ser um objeto JSON`);
  }
  return valor as Objeto;
}

function exatamente(objeto: Objeto, chaves: readonly string[], rotulo: string): void {
  const reais = Object.keys(objeto).sort();
  const esperadas = [...chaves].sort();
  if (reais.length !== esperadas.length || reais.some((chave, i) => chave !== esperadas[i])) {
    throw new ErroFerramenta(
      `${rotulo} com campos fora do esperado (exatamente ${chaves.join(', ')})`
    );
  }
}

/** base64 canônico de tamanho exato: decodifica, tem o tamanho certo e recodifica igual. */
function base64Canonico(valor: unknown, tamanho: number, rotulo: string): string {
  if (typeof valor !== 'string' || !RE_B64.test(valor)) {
    throw new ErroFerramenta(`credencial: ${rotulo} fora do formato base64`);
  }
  const bytes = base64ParaBytes(valor);
  if (bytes.byteLength !== tamanho || bytesParaBase64(bytes) !== valor) {
    throw new ErroFerramenta(`credencial: ${rotulo} com tamanho diferente de ${tamanho} bytes`);
  }
  return valor;
}

export function validarCredencial(valor: unknown): CredencialAdmin {
  const o = objetoSimples(valor, 'credencial');
  exatamente(o, ['auth', 'embrulho', 'login', 'salt'], 'credencial');
  if (o['login'] !== LOGIN_ADMIN) {
    throw new ErroFerramenta('credencial: login diferente de admin');
  }
  const salt = base64Canonico(o['salt'], 16, 'salt');
  const auth = o['auth'];
  if (
    typeof auth !== 'string' ||
    !RE_AUTH.test(auth) ||
    Buffer.from(auth, 'base64url').byteLength !== 32
  ) {
    throw new ErroFerramenta(
      'credencial: auth fora do formato (base64url de 32 bytes, 43 caracteres)'
    );
  }
  const e = objetoSimples(o['embrulho'], 'embrulho');
  exatamente(e, ['ct', 'iv', 'v'], 'embrulho');
  if (e['v'] !== 1) {
    throw new ErroFerramenta('credencial: versão do embrulho diferente de 1');
  }
  const iv = base64Canonico(e['iv'], 12, 'embrulho.iv');
  const ct = base64Canonico(e['ct'], 48, 'embrulho.ct');
  return { login: LOGIN_ADMIN, salt, auth, embrulho: { v: 1, iv, ct } };
}

function ehTipo(valor: unknown): valor is TipoImagem {
  return typeof valor === 'string' && (TIPOS as readonly string[]).includes(valor);
}

export function validarAcervo(valor: unknown): Acervo {
  const o = objetoSimples(valor, 'acervo');
  exatamente(o, ['indice', 'kid'], 'acervo');
  const kid = o['kid'];
  if (typeof kid !== 'string' || !RE_KID.test(kid)) {
    throw new ErroFerramenta('acervo: kid fora do formato (32 hex minúsculos)');
  }
  const indice = o['indice'];
  if (!Array.isArray(indice)) {
    throw new ErroFerramenta('acervo: indice precisa ser uma lista');
  }
  const ids = new Set<string>();
  const entradas = indice.map((item: unknown, i): EntradaAcervo => {
    const e = objetoSimples(item, `acervo.indice[${i}]`);
    exatamente(e, ['bytes', 'id', 'tipo'], `acervo.indice[${i}]`);
    const id = e['id'];
    if (typeof id !== 'string' || !ehIdImagem(id)) {
      throw new ErroFerramenta(`acervo.indice[${i}]: id fora do formato`);
    }
    const tipo = e['tipo'];
    if (!ehTipo(tipo)) {
      throw new ErroFerramenta(`acervo.indice[${i}]: tipo fora de jpeg, png e webp`);
    }
    const bytes = e['bytes'];
    if (typeof bytes !== 'number' || !Number.isSafeInteger(bytes) || bytes < 0) {
      throw new ErroFerramenta(`acervo.indice[${i}]: bytes fora do formato`);
    }
    if (ids.has(id)) {
      throw new ErroFerramenta(`acervo.indice[${i}]: id repetido`);
    }
    ids.add(id);
    return { id, tipo, bytes };
  });
  return { kid, indice: entradas };
}
