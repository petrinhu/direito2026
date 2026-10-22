import type { PerguntaQuiz } from '../../../../tipos';
import { comunicacao } from './comunicacao';
import { formalismo } from './formalismo';
import { penumbra } from './penumbra';
import { precedentes } from './precedentes';

/**
 * O quiz de Introdução ao Direito, Unidade 3: 30 perguntas de múltipla escolha
 * com quatro alternativas, em quatro arquivos por tema (comunicação de padrões,
 * penumbra, formalismo e padrões variáveis, regras fixas e precedentes). Este só
 * os junta, na ordem de estudo, com ids de 1 a 30 sem buraco.
 */
export const quiz: readonly PerguntaQuiz[] = [
  ...comunicacao,
  ...penumbra,
  ...formalismo,
  ...precedentes
];
