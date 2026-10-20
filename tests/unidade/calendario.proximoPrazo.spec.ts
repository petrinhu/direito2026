import { describe, expect, it } from 'vitest';
import { proximoPrazo } from '@/core/calendario/proximoPrazo';

const FIM_ONLINE = 'o fim das provas online de Economia e Empreendedorismo';

describe('proximoPrazo', () => {
  it('prazo que já acabou não conta', () => {
    expect(
      proximoPrazo([{ data: '2026-11-15', descricao: FIM_ONLINE }], '2026-11-16')
    ).toBeUndefined();
  });

  it('prazo de hoje conta com zero dias', () => {
    expect(proximoPrazo([{ data: '2026-11-15', descricao: FIM_ONLINE }], '2026-11-15')).toEqual({
      data: '2026-11-15',
      dias: 0,
      descricao: FIM_ONLINE
    });
  });

  it('entre vários prazos futuros, devolve o mais próximo', () => {
    const r = proximoPrazo(
      [
        { data: '2026-12-01', descricao: 'segundo' },
        { data: '2026-11-15', descricao: 'primeiro' }
      ],
      '2026-10-20'
    );
    expect(r).toEqual({ data: '2026-11-15', dias: 26, descricao: 'primeiro' });
  });

  it('sem prazos devolve undefined', () => {
    expect(proximoPrazo([], '2026-10-20')).toBeUndefined();
  });
});
