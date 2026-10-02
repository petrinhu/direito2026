import { construirArvoreMapa } from './arvoreMapa';
import type { MapaFichamento, NoMapa } from './tipos';

/** Mesma forma do nó de entrada do markmap (content em HTML), sem importar a biblioteca. */
export interface NoMarkmap {
  content: string;
  children: NoMarkmap[];
  payload?: { fold?: number; ramo?: number };
}

const ENTIDADES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ENTIDADES[c]!);
}

function conteudoDoNo(no: NoMapa, baseUnidade: string): string {
  if (no.tipo === 'ficha') {
    return `<a href="${escaparHtml(baseUnidade)}/fichamento#ficha-${escaparHtml(no.fichaId ?? '')}">${escaparHtml(no.rotulo)}</a>`;
  }
  if (no.detalhe) return `<strong>${escaparHtml(no.rotulo)}:</strong> ${escaparHtml(no.detalhe)}`;
  return escaparHtml(no.rotulo);
}

function converter(no: NoMapa, baseUnidade: string, ramo: number | undefined): NoMarkmap {
  const noh: NoMarkmap = {
    content: conteudoDoNo(no, baseUnidade),
    children: no.filhos.map((f) => converter(f, baseUnidade, ramo))
  };
  if (ramo !== undefined) noh.payload = { ramo };
  return noh;
}

/**
 * Árvore do mapa visual (markmap): raiz, períodos, pensadores e, dentro de
 * cada pensador, modo de pensar, conceitos e "para o Direito hoje". O nível
 * de fase some (o pensador fica direto sob o período), como na lista do mapa
 * começando por períodos e pensadores. Os pensadores nascem recolhidos.
 */
export function paraArvoreMarkmap(dados: MapaFichamento, baseUnidade: string): NoMarkmap {
  const completa = construirArvoreMapa(dados);
  let proximoRamo = 0;
  return {
    content: escaparHtml(completa.rotulo),
    children: completa.filhos.map((era) => ({
      content: escaparHtml(era.rotulo),
      children: era.filhos
        .flatMap((fase) => fase.filhos)
        .map((pensador) => {
          const ramo = proximoRamo++;
          const noh = converter(pensador, baseUnidade, ramo);
          noh.payload = { ramo, fold: 1 };
          return noh;
        })
    }))
  };
}

/** Verdadeiro quando nenhum nó com filhos está recolhido. */
export function todosRamosAbertos(raiz: NoMarkmap): boolean {
  if (raiz.children.length > 0 && raiz.payload?.fold) return false;
  return raiz.children.every(todosRamosAbertos);
}

/**
 * Abre todos os ramos, ou volta ao começo (raiz e períodos abertos, pensadores
 * recolhidos). Muta a árvore.
 */
export function definirTodosRamos(raiz: NoMarkmap, aberto: boolean, profundidade = 0): void {
  if (raiz.children.length > 0) {
    const recolhido = !aberto && profundidade >= 2;
    raiz.payload = { ...raiz.payload, fold: recolhido ? 1 : 0 };
  }
  raiz.children.forEach((f) => definirTodosRamos(f, aberto, profundidade + 1));
}
