import type { PerguntaQuiz } from '../../../../tipos';
import { infancia } from './infancia';
import { mediacao } from './mediacao';
import { riscos } from './riscos';
import { vinculo } from './vinculo';

/**
 * O quiz de Sociologia Jurídica, Unidade 3: 40 perguntas de múltipla escolha
 * com quatro alternativas, em quatro arquivos por tema (infância e mídias,
 * riscos e crimes, mediação parental, vínculo e responsabilidade). Este só os
 * junta, na ordem de estudo, com ids de 1 a 40 sem buraco.
 */
export const quiz: readonly PerguntaQuiz[] = [
  ...infancia,
  ...riscos,
  ...mediacao,
  ...vinculo
];
