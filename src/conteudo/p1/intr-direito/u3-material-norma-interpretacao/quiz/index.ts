import type { PerguntaQuiz } from '../../../../tipos';
import { fontes } from './fontes';
import { norma } from './norma';
import { sentenca } from './sentenca';
import { interpretacao } from './interpretacao';

/**
 * O quiz da unidade de Introdução ao Direito (norma, interpretação e fontes):
 * 30 perguntas de múltipla escolha com quatro alternativas, em quatro arquivos
 * por tema. Este só os junta, na ordem de estudo, com ids de 1 a 30 sem buraco.
 */
export const quiz: readonly PerguntaQuiz[] = [
  ...fontes,
  ...norma,
  ...sentenca,
  ...interpretacao
];
