import type { PerguntaQuiz } from '../../../../tipos';
import { comercial } from './comercial';
import { conceitos } from './conceitos';
import { protecao } from './protecao';
import { responsabilidade } from './responsabilidade';

/**
 * O quiz do ECA Digital: 40 perguntas de múltipla escolha com quatro
 * alternativas, em quatro arquivos por tema (objeto e definições, proteção e
 * idade, jogos, publicidade e vínculo, violações e sanções). Este só os junta,
 * na ordem de estudo, com ids de 1 a 40 sem buraco.
 */
export const quiz: readonly PerguntaQuiz[] = [
  ...conceitos,
  ...protecao,
  ...comercial,
  ...responsabilidade
];
