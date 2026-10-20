import type { PerguntaQuiz } from '../../../../tipos';
import { atividade } from './atividade';
import { conceitos } from './conceitos';
import { classicos } from './classicos';
import { aplicacao } from './aplicacao';

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
