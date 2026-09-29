import type { IndiceAlternativa } from '../unidade/tipos';

const LETRAS = ['A', 'B', 'C', 'D', 'E'] as const;

/** Letra exibida para a alternativa na posição `indice` da ordem embaralhada. */
export function rotuloAlternativa(indice: IndiceAlternativa | number): string {
  return LETRAS[indice] ?? '';
}

/**
 * Só as perguntas de cinco alternativas (Sociologia Jurídica) mostram
 * letras. As das outras cadeiras nunca as mostraram, e continuam assim.
 */
export function mostrarLetras(quantidadeDeAlternativas: number): boolean {
  return quantidadeDeAlternativas === 5;
}
