import { describe, expect, it } from 'vitest';
import { legendaDoCalendario } from '@/app/calendario/legendaDoCalendario';

describe('legenda do calendário, provas online', () => {
  it('traz a categoria online com a classe de cor própria e o rótulo longo', () => {
    const item = legendaDoCalendario().find((i) => i.categoria === 'online');
    expect(item).toEqual({
      categoria: 'online',
      rotulo: 'Provas online',
      classe: 'cal-cat-online'
    });
  });
});
