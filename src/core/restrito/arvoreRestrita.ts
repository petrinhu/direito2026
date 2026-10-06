import { definirTodosRamos, escaparHtml, type NoMarkmap } from '../fichamento/arvoreMarkmap';
import type { NoMapa as NoLista, TipoNoMapa } from '../fichamento/tipos';
import type { NoMapa } from './tipos';

function paraMarkmap(no: NoMapa, ramo: number | undefined): NoMarkmap {
  const noh: NoMarkmap = {
    content: escaparHtml(no.rotulo),
    children: (no.filhos ?? []).map((f) => paraMarkmap(f, ramo))
  };
  if (ramo !== undefined) noh.payload = { ramo };
  return noh;
}

/**
 * Árvore do mapa visual (markmap) a partir do mapa genérico do conteúdo
 * restrito. O rótulo é escapado (nunca HTML no SVG). Cada filho direto da
 * raiz é um ramo de cor; raiz e ramos nascem abertos, o resto recolhido.
 */
export function paraArvoreMarkmapRestrita(raiz: NoMapa): NoMarkmap {
  const arvore: NoMarkmap = {
    content: escaparHtml(raiz.rotulo),
    children: (raiz.filhos ?? []).map((filho, ramo) => paraMarkmap(filho, ramo))
  };
  definirTodosRamos(arvore, false);
  return arvore;
}

function tipoPorNivel(nivel: number): TipoNoMapa {
  if (nivel === 0) return 'raiz';
  return nivel === 1 ? 'ramo' : 'galho';
}

function paraLista(no: NoMapa, nivel: number, id: string): NoLista {
  return {
    id,
    tipo: tipoPorNivel(nivel),
    rotulo: no.rotulo,
    filhos: (no.filhos ?? []).map((f, i) => paraLista(f, nivel + 1, `${id}-${i}`))
  };
}

/** Mesma fonte, forma da lista acessível (role="tree") de Filosofia. */
export function paraArvoreLista(raiz: NoMapa): NoLista {
  return paraLista(raiz, 0, 'mapa-restrito');
}
