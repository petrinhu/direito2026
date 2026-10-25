import type { MetaUnidade } from '../../../tipos';

/**
 * Metadados da AV 3. Nasce em-breve: a unidade fica
 * fora do menu até o estado virar 'publicado', e isso só depois de o resumo, o mapa,
 * o fichamento, os mnemônicos e o quiz terem texto.
 *
 * Regras de texto (ordem do líder):
 * - Nunca "na aula X", "no slide Y" nem "o material": a fonte é a disciplina.
 * - Fonte genérica, sempre: "Material de aula da disciplina.".
 * - Sem travessão (nem em-dash, nem en-dash).
 * - Sem nome de pessoa da turma, do professor ou da instituição.
 */
export const meta: MetaUnidade = {
  estado: 'em-breve',
  titulo: 'ECA Digital',
  subtitulo: 'Sociologia Jurídica · AV3 · faculdade · 1º período',
  descricao: 'A escrever antes da publicação.'
};
