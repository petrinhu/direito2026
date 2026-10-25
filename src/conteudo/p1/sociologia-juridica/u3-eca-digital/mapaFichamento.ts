import type { MapaFichamento } from '../../../tipos';

/**
 * Mapa mental e fichamento da unidade. Nasce sem eras nem pensadores.
 * Cada pensador aponta para um bloco do resumo (blocoResumo) que existe.
 *
 * Regras de texto (ordem do líder):
 * - Nunca "na aula X", "no slide Y" nem "o material": a fonte é a disciplina.
 * - Fonte genérica, sempre: "Material de aula da disciplina.".
 * - Sem travessão (nem em-dash, nem en-dash).
 * - Sem nome de pessoa da turma, do professor ou da instituição.
 */
export const mapaFichamento: MapaFichamento = {
  titulo: 'ECA Digital',
  eras: [],
  pensadores: []
};
