import type { TipoImagem } from '../../src/core/juri/formatoImagem';
import { ehIdImagem } from '../../src/core/juri/idImagem';
import { ErroFerramenta } from './erro';

/*
 * Contrato do acervo.json (plano do CTO, seção 5.2; o imagem.php do servidor lê este formato):
 * {"indice": [{"id": "<32 hex>", "tipo": "jpeg|png|webp", "bytes": n, "sha256": "<64 hex>"}]}.
 * Nada além disso: sem kid, sem credencial. Campo a mais ou a menos reprova.
 */

const TIPOS: readonly TipoImagem[] = ['jpeg', 'png', 'webp'];
const RE_SHA = /^[0-9a-f]{64}$/;

export interface EntradaIndice {
  id: string;
  tipo: TipoImagem;
  bytes: number;
  sha256: string;
}

export interface Indice {
  indice: EntradaIndice[];
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

function ehTipo(valor: unknown): valor is TipoImagem {
  return typeof valor === 'string' && (TIPOS as readonly string[]).includes(valor);
}

export function validarIndice(valor: unknown): Indice {
  const o = objetoSimples(valor, 'acervo.json');
  exatamente(o, ['indice'], 'acervo.json');
  const lista = o['indice'];
  if (!Array.isArray(lista)) {
    throw new ErroFerramenta('acervo.json: indice precisa ser uma lista');
  }
  const ids = new Set<string>();
  const indice = lista.map((item: unknown, i): EntradaIndice => {
    const rotulo = `acervo.json indice[${i}]`;
    const e = objetoSimples(item, rotulo);
    exatamente(e, ['bytes', 'id', 'sha256', 'tipo'], rotulo);
    const id = e['id'];
    if (typeof id !== 'string' || !ehIdImagem(id)) {
      throw new ErroFerramenta(`${rotulo}: id fora do formato`);
    }
    if (ids.has(id)) {
      throw new ErroFerramenta(`${rotulo}: id repetido`);
    }
    ids.add(id);
    const tipo = e['tipo'];
    if (!ehTipo(tipo)) {
      throw new ErroFerramenta(`${rotulo}: tipo fora de jpeg, png e webp`);
    }
    const bytes = e['bytes'];
    if (typeof bytes !== 'number' || !Number.isSafeInteger(bytes) || bytes <= 0) {
      throw new ErroFerramenta(`${rotulo}: bytes fora do formato`);
    }
    const sha256 = e['sha256'];
    if (typeof sha256 !== 'string' || !RE_SHA.test(sha256)) {
      throw new ErroFerramenta(`${rotulo}: sha256 fora do formato`);
    }
    return { id, tipo, bytes, sha256 };
  });
  return { indice };
}
