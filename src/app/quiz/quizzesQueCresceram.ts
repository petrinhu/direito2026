import type { ChaveUnidade } from '@/core/progresso/tipos';

/**
 * Quizzes que cresceram no ar (AV3-K4, decisão do líder de 13/11/2026: "Zerar todas as
 * antigas"). Todo registro LEGADO dessas unidades (formato antigo, sem
 * quizRespostasOriginais) tem as respostas do quiz zeradas, sem depender de atualizadoEm:
 * o formato antigo não separa respostas dadas antes e depois do crescimento. Quem
 * respondeu depois do crescimento também responde de novo. Os demais quizzes legados
 * seguem traduzidos (app/quiz/migrarRegistroLegado.ts).
 */
export const QUIZZES_QUE_CRESCERAM: readonly ChaveUnidade[] = [
  'p1/intr-direito/u3-material-norma-interpretacao',
  'p1/sociologia-juridica/u3-eca-digital'
];
