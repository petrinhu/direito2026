/**
 * Quando a página volta a ser mostrada: vinda do cache de navegação (botão
 * Voltar depois de sair) ou com a aba que voltou ao primeiro plano (plano
 * 2.2). Os dois gatilhos são só assinaturas: o DOM mora em main.ts (L-50).
 */
export interface FonteVolta {
  /** `vinDoCache` é true quando o navegador restaurou a página da memória (pageshow.persisted). */
  aoMostrarPagina(callback: (vinDoCache: boolean) => void): () => void;
  aoFicarVisivel(callback: () => void): () => void;
}

export interface AcoesVolta {
  readonly recarregar: () => void;
  readonly conferir: () => void;
}

export function vigiarVolta(fonte: FonteVolta, acoes: AcoesVolta): () => void {
  const cancelarMostrar = fonte.aoMostrarPagina((vinDoCache) => {
    // Página de antes do sair não pode aparecer de novo: recarrega e cai no portão.
    if (vinDoCache) acoes.recarregar();
  });
  const cancelarVisivel = fonte.aoFicarVisivel(acoes.conferir);
  return () => {
    cancelarMostrar();
    cancelarVisivel();
  };
}
