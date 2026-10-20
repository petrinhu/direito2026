// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { dataDaCelulaSob } from '@/app/calendario/dataDaCelulaSob';

/**
 * Achado D1 do QA visual (20/10/2026): clicar no centro de uma célula coberta
 * por barra de vários dias abria o PRIMEIRO dia da barra. A barra fica
 * dentro da célula de início, então subir pelos ancestrais do elemento da
 * barra devolve a célula errada. A função recebe a lista de elementos sob o
 * ponteiro (document.elementsFromPoint) e devolve a célula que é ela mesma
 * `.fc-daygrid-day[data-date]`. Sem nenhuma, cai para a data de início.
 */
function celula(data: string): HTMLElement {
  const td = document.createElement('td');
  td.className = 'fc-daygrid-day';
  td.setAttribute('data-date', data);
  return td;
}

function barra(): HTMLElement {
  const harness = document.createElement('div');
  harness.className = 'fc-daygrid-event-harness-abs';
  return harness;
}

describe('dataDaCelulaSob: dia sob o ponteiro, não o início da barra', () => {
  it('clique numa célula coberta pela barra devolve o dia da célula, não o início da barra', () => {
    const celula16 = celula('2026-10-16');
    const elementos = [barra(), celula16, document.createElement('tr')];
    expect(dataDaCelulaSob(elementos, '2026-10-13')).toBe('2026-10-16');
  });

  it('ignora elementos que não são a célula (número do dia, texto da barra)', () => {
    const numero = document.createElement('a');
    numero.className = 'fc-daygrid-day-number';
    const celula24 = celula('2026-11-24');
    expect(dataDaCelulaSob([numero, celula24], '2026-11-23')).toBe('2026-11-24');
  });

  it('sem nenhuma célula sob o ponteiro (ex.: tecla Enter, clique em 0,0), cai para a data de início', () => {
    expect(dataDaCelulaSob([barra()], '2026-10-13')).toBe('2026-10-13');
  });

  it('lista vazia cai para a data de início', () => {
    expect(dataDaCelulaSob([], '2026-12-09')).toBe('2026-12-09');
  });
});
