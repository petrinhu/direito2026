import type { InjectionKey } from 'vue';

/**
 * Canal entre a página e o LayoutBase (E2E-G1A-ADAPTADO): a página entrega o elemento logo depois do
 * título onde o quadro de prova fica no modo adaptado, e entrega null quando sai da tela.
 */
export const CHAVE_ALVO_QUADRO_APOS_TITULO: InjectionKey<(elemento: HTMLElement | null) => void> =
  Symbol('alvoQuadroAposTitulo');
