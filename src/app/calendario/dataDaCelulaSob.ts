/** Elemento sob o ponteiro: a forma mínima que a função usa (sem depender do DOM). */
export interface ElementoSobPonteiro {
  matches(seletor: string): boolean;
  getAttribute(nome: string): string | null;
}

const SELETOR_CELULA = '.fc-daygrid-day[data-date]';

/**
 * Dia da célula sob o ponteiro. A lista vem de document.elementsFromPoint, de
 * cima para baixo. Testa a própria célula (`matches`), não um ancestral
 * (`closest`): a barra de vários dias é filha da célula de INÍCIO, então subir
 * a partir dela devolve o primeiro dia da barra (defeito D1 do QA visual).
 * Sem célula na lista (ex.: tecla Enter, ponto 0,0), vale a data de início.
 */
export function dataDaCelulaSob(
  elementos: readonly ElementoSobPonteiro[],
  dataDeInicio: string
): string {
  for (const elemento of elementos) {
    if (!elemento.matches(SELETOR_CELULA)) continue;
    const data = elemento.getAttribute('data-date');
    if (data) return data;
  }
  return dataDeInicio;
}
