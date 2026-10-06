import type { Slide } from './tipos';

export type CorSlide =
  'ciano' | 'turquesa' | 'violeta' | 'magenta' | 'menta' | 'coral' | 'ambar' | 'ouro';

export type TipoComposicao =
  | 'capa'
  | 'estatisticas'
  | 'trilhas'
  | 'mosaico'
  | 'linha'
  | 'grade'
  | 'destaque'
  | 'comparativo'
  | 'encerramento';

export interface ItemComposto {
  readonly texto: string;
  /** Texto sem o número ou o rótulo que virou destaque. */
  readonly corpo: string;
  readonly rotulo?: string;
  readonly numero?: string;
  readonly cor: CorSlide;
}

export interface ColunaComposta {
  readonly titulo: string;
  readonly itens: readonly string[];
  readonly cor: CorSlide;
}

export interface ComposicaoSlide {
  readonly tipo: TipoComposicao;
  readonly acento: CorSlide;
  readonly itens: readonly ItemComposto[];
  readonly colunas: readonly ColunaComposta[];
}

const ACENTOS: readonly CorSlide[] = ['ciano', 'violeta', 'ambar', 'menta', 'magenta', 'turquesa'];
const CORES_ITENS: readonly CorSlide[] = ['ciano', 'ouro', 'violeta', 'magenta', 'menta', 'ambar'];
const CORES_DUAS: readonly CorSlide[] = ['menta', 'violeta'];
const CORES_TRES: readonly CorSlide[] = ['ciano', 'ambar', 'coral'];

const MAXIMO_ROTULO = 46;
/** Do slide 1 ao 5 o rótulo vira trilha; depois, mosaico (variar a composição). */
const ULTIMO_ID_TRILHAS = 5;
const REGEX_NUMERO = /^(\d{1,3}(?:[.,]\d+)?\s?%?)\s+(\S.*)$/;

function acentoDoSlide(slide: Slide): CorSlide {
  if (slide.layout === 'encerramento') return 'menta';
  if (slide.layout === 'destaque') return 'magenta';
  return ACENTOS[(Math.max(slide.id, 1) - 1) % ACENTOS.length]!;
}

function corDoRotulo(rotulo: string, indice: number, acento: CorSlide): CorSlide {
  const chave = rotulo.trim().toLowerCase();
  if (chave.startsWith('dentro')) return 'menta';
  if (chave.startsWith('fora')) return 'coral';
  const inicio = Math.max(CORES_ITENS.indexOf(acento), 0);
  return CORES_ITENS[(inicio + indice) % CORES_ITENS.length]!;
}

function separarRotulo(texto: string): { rotulo: string; corpo: string } | undefined {
  const posicao = texto.indexOf(':');
  if (posicao < 2 || posicao > MAXIMO_ROTULO) return undefined;
  const corpo = texto.slice(posicao + 1).trim();
  if (corpo.length === 0) return undefined;
  return { rotulo: texto.slice(0, posicao).trim(), corpo };
}

function comporItens(itens: readonly string[], acento: CorSlide): ItemComposto[] {
  return itens.map((texto, i) => {
    const numero = REGEX_NUMERO.exec(texto);
    if (numero) {
      return {
        texto,
        numero: numero[1]!.replace(/\s/g, ''),
        corpo: numero[2]!,
        cor: CORES_ITENS[(Math.max(CORES_ITENS.indexOf(acento), 0) + i) % CORES_ITENS.length]!
      };
    }
    const separado = separarRotulo(texto);
    if (separado) {
      return { texto, ...separado, cor: corDoRotulo(separado.rotulo, i, acento) };
    }
    return {
      texto,
      corpo: texto,
      cor: CORES_ITENS[(Math.max(CORES_ITENS.indexOf(acento), 0) + i) % CORES_ITENS.length]!
    };
  });
}

function tipoDosTopicos(slide: Slide, itens: readonly ItemComposto[]): TipoComposicao {
  if (itens.filter((i) => i.numero !== undefined).length >= 2) return 'estatisticas';
  if (itens.length > 0 && itens.every((i) => i.rotulo !== undefined)) {
    return slide.id <= ULTIMO_ID_TRILHAS ? 'trilhas' : 'mosaico';
  }
  return slide.id % 2 === 0 ? 'linha' : 'grade';
}

/**
 * Decide a composição visual do slide só a partir dos dados que já existem
 * (layout, id, quantidade e forma dos itens): o esquema do conteúdo não muda.
 */
export function compor(slide: Slide): ComposicaoSlide {
  const acento = acentoDoSlide(slide);
  const itens = comporItens(slide.itens ?? [], acento);
  const paleta = (slide.colunas?.length ?? 0) === 2 ? CORES_DUAS : CORES_TRES;
  const colunas = (slide.colunas ?? []).map((c, i) => ({
    titulo: c.titulo,
    itens: c.itens,
    cor: paleta[i % paleta.length]!
  }));

  let tipo: TipoComposicao;
  switch (slide.layout) {
    case 'topicos':
      tipo = tipoDosTopicos(slide, itens);
      break;
    default:
      tipo = slide.layout;
  }
  return { tipo, acento, itens, colunas };
}
