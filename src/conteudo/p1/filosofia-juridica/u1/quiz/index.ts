import type { PerguntaQuiz } from '../../../../tipos';
import { revisao } from './revisao';
import { antiga } from './antiga';
import { media } from './media';

/**
 * O quiz de Filosofia Jurídica, 1a unidade: 80 perguntas, sendo 40 de
 * múltipla escolha com cinco alternativas e 40 de verdadeiro ou falso. Em
 * três arquivos por categoria (revisao, antiga, media); este só os junta,
 * na ordem de estudo. As 20 de revisão são do simulado do professor.
 */
export const quiz: readonly PerguntaQuiz[] = [
  ...revisao,
  ...antiga,
  ...media
];
