import type { CategoriaQuiz } from './tipos';

/**
 * Rótulo de exibição de cada categoria de pergunta do quiz. Fonte única:
 * antes vivia duplicado (e com tipo frouxo, Record<string,string>) dentro
 * de ResultadoQuiz.vue; passou a ser importado também por
 * MenuCurriculo.vue (submenu de Quiz, ordem do líder, 22/09/2026), que
 * mostra a categoria com a contagem de perguntas.
 */
export const ROTULOS_CATEGORIA_QUIZ: Record<CategoriaQuiz, string> = {
  teoria: 'Teoria',
  peticao: 'Petição',
  fundamentos: 'Fundamentos'
};
