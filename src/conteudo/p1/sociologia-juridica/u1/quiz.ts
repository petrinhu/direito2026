import type { PerguntaQuiz } from '../../../tipos';
import { atividade } from './quiz/atividade';
import { conceitos } from './quiz/conceitos';
import { classicos } from './quiz/classicos';
import { aplicacao } from './quiz/aplicacao';

/**
 * O quiz de Sociologia Jurídica, 1a unidade: 80 perguntas de cinco
 * alternativas, em quatro arquivos por categoria (atividade, conceitos,
 * classicos, aplicacao). Este arquivo só os junta, na ordem de estudo.
 */
export const quiz: readonly PerguntaQuiz[] = [
  ...atividade,
  ...conceitos,
  ...classicos,
  ...aplicacao
];
