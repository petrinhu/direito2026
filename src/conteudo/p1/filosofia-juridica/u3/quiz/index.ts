import type { PerguntaQuiz } from '../../../../tipos';
import { moderna } from './moderna';
import { social } from './social';

/**
 * O quiz de Filosofia Jurídica, 3a unidade: 20 perguntas de múltipla escolha
 * com quatro alternativas, em dois arquivos por bloco (moderna, social). Este
 * só os junta, na ordem de estudo. Sem perguntas de verdadeiro ou falso nesta
 * etapa, e sem selo de professor. O Bloco 3 ainda não tem perguntas.
 */
export const quiz: readonly PerguntaQuiz[] = [
  ...moderna,
  ...social
];
