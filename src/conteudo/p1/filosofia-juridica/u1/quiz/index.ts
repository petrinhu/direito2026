import type { PerguntaQuiz } from '../../../../tipos';
import { revisao } from './revisao';
import { antiga } from './antiga';
import { media } from './media';

/**
 * O quiz de Filosofia Jurídica, 1a unidade. Em três arquivos por categoria
 * (revisao, antiga, media); este só os junta, na ordem de estudo. As perguntas
 * de revisão são do simulado do professor (verdadeiro ou falso). A contagem
 * por tipo está congelada em tests/caracterizacao/, não neste comentário.
 */
export const quiz: readonly PerguntaQuiz[] = [
  ...revisao,
  ...antiga,
  ...media
];
