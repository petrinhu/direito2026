import type { ChaveAba } from './tipos';

/**
 * Rótulo de exibição de cada aba de unidade. Fonte única: antes vivia
 * duplicado dentro de AbasUnidade.vue; passou a ser importado também por
 * MenuCurriculo.vue (4o nível da árvore, ordem do líder, 22/09/2026) para
 * nomear os grupos "Resumo", "Petição comentada" e "Quiz" sem duplicar a
 * string em dois lugares e correr o risco de os rótulos divergirem.
 */
export const ROTULOS_ABA: Record<ChaveAba, string> = {
  resumo: 'Resumo',
  peticao: 'Petição comentada',
  quiz: 'Quiz'
};
