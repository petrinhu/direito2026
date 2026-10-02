export interface RetanguloMapa {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface VistaMapa {
  readonly k: number;
  readonly x: number;
  readonly y: number;
}

export interface EntradaEnquadre {
  /** Retângulo do conteúdo do mapa, em coordenadas do mapa. */
  readonly conteudo: RetanguloMapa;
  readonly quadro: { readonly largura: number; readonly altura: number };
  /** Escala abaixo da qual o texto fica menor que o mínimo legível. */
  readonly escalaMinima: number;
  readonly escalaMaxima: number;
  /** Folga do enquadre total (0,95 = 5%). */
  readonly razao: number;
  /** Margem à esquerda quando a raiz é alinhada à borda. */
  readonly margem: number;
  /** Nó clicado, em coordenadas do mapa: o quadro centraliza nele. Ausente: alinha a raiz. */
  readonly foco?: { readonly x: number; readonly y: number };
  /** Centro vertical da raiz, usado quando não há foco. */
  readonly raiz: { readonly y: number };
}

/**
 * Decide escala e translação. Se o mapa inteiro cabe sem o texto ficar abaixo
 * do mínimo, enquadra tudo e centraliza. Senão, a escala trava no mínimo e o
 * resto fica para o arrastar: centraliza no nó clicado ou, sem foco, alinha a
 * raiz à borda esquerda.
 */
export function calcularEnquadre(e: EntradaEnquadre): VistaMapa {
  const { conteudo: c, quadro } = e;
  const largura = Math.max(c.x2 - c.x1, 1);
  const altura = Math.max(c.y2 - c.y1, 1);
  const ajustada = Math.min(
    (quadro.largura / largura) * e.razao,
    (quadro.altura / altura) * e.razao
  );

  if (ajustada >= e.escalaMinima) {
    const k = Math.min(ajustada, e.escalaMaxima);
    return {
      k,
      x: (quadro.largura - largura * k) / 2 - c.x1 * k,
      y: (quadro.altura - altura * k) / 2 - c.y1 * k
    };
  }

  const k = e.escalaMinima;
  if (e.foco) {
    return { k, x: quadro.largura / 2 - e.foco.x * k, y: quadro.altura / 2 - e.foco.y * k };
  }
  return { k, x: e.margem - c.x1 * k, y: quadro.altura / 2 - e.raiz.y * k };
}
