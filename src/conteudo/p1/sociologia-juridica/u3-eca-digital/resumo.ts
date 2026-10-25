import type { BlocoResumo } from '../../../tipos';

/**
 * Resumo da unidade, em blocos teóricos. Nasce vazio.
 * Cada bloco: id estável (bloco-0, bloco-1...), numero a partir de 1, titulo sem
 * "Bloco N" (a página já numera), fonte, corpoHtml sem repetir a fonte, resumo
 * (itens curtos) e exemploHtml.
 *
 * Regras de texto (ordem do líder):
 * - Nunca "na aula X", "no slide Y" nem "o material": a fonte é a disciplina.
 * - Fonte genérica, sempre: "Material de aula da disciplina.".
 * - Sem travessão (nem em-dash, nem en-dash).
 * - Sem nome de pessoa da turma, do professor ou da instituição.
 */
export const resumo: readonly BlocoResumo[] = [];
