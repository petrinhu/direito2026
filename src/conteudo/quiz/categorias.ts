import type { RotulosCategoriaQuiz } from '@/core/quiz/rotulosCategoria';

/**
 * Rótulo de exibição de cada categoria de pergunta do quiz. É dado de
 * conteúdo: uma categoria nova entra aqui, junto com o rótulo, sem mexer em
 * código. A regra "toda categoria usada tem rótulo" é testada em
 * tests/unidade/quiz.categoriasComRotulo.spec.ts.
 */
export const ROTULOS_CATEGORIA_QUIZ: RotulosCategoriaQuiz = {
  teoria: 'Teoria',
  peticao: 'Petição',
  fundamentos: 'Fundamentos',
  atividade: 'Atividade da aula',
  conceitos: 'Conceitos',
  classicos: 'Os clássicos',
  aplicacao: 'Aplicação',
  antiga: 'Idade Antiga',
  media: 'Idade Média',
  revisao: 'Revisão do professor',
  'filosofia-moderna': 'Filosofia Moderna',
  'filosofia-social': 'Filosofia Social'
};
