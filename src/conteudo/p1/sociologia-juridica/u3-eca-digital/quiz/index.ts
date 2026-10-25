import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Quiz da unidade: múltipla escolha, com quatro alternativas (ou cinco, sempre o mesmo
 * número em todo o quiz). Nasce vazio. A explicação nunca cita letra nem posição de
 * alternativa, porque o motor embaralha as respostas.
 *
 * Regras de texto (ordem do líder):
 * - Nunca "na aula X", "no slide Y" nem "o material": a fonte é a disciplina.
 * - Fonte genérica, sempre: "Material de aula da disciplina.".
 * - Sem travessão (nem em-dash, nem en-dash).
 * - Sem nome de pessoa da turma, do professor ou da instituição.
 */
export const quiz: readonly PerguntaQuiz[] = [];
