import type { Mnemonico } from '../../../tipos';

/**
 * Mnemônicos da unidade: apoios de memória para o que mais se confunde. Nasce vazio.
 * Cada um aponta para um bloco do resumo (blocoResumo) e declara a técnica usada.
 *
 * Regras de texto (ordem do líder):
 * - Nunca "na aula X", "no slide Y" nem "o material": a fonte é a disciplina.
 * - Fonte genérica, sempre: "Material de aula da disciplina.".
 * - Sem travessão (nem em-dash, nem en-dash).
 * - Sem nome de pessoa da turma, do professor ou da instituição.
 */
export const mnemonicos: readonly Mnemonico[] = [];
