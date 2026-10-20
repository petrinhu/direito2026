import { describe, expect, it } from 'vitest';
import { proximaProva } from '@/core/calendario/proximaProva';
import type { Prova } from '@/core/calendario/tipos';

const prova = (data: string, cadeiraId: string, tipo: Prova['tipo'] = 'AV1'): Prova => ({
  data,
  cadeiraId,
  cadeiraNome: cadeiraId,
  tipo
});

const PROVAS: Prova[] = [
  prova('2026-09-22', 'intr', 'AV1'),
  prova('2026-10-16', 'intr', 'AV2'),
  prova('2026-10-16', 'soc', 'AV2'),
  prova('2026-11-24', 'intr', 'AV3'),
  prova('2026-12-09', 'intr', 'chamada'),
  prova('2026-12-09', 'fil', 'chamada'),
  prova('2026-12-15', 'intr', 'final')
];

describe('proximaProva', () => {
  it('escolhe a data mais próxima que ainda não passou', () => {
    const r = proximaProva(PROVAS, '2026-10-20');
    expect(r?.data).toBe('2026-11-24');
    expect(r?.dias).toBe(35);
  });

  it('traz só as provas daquele dia, agrupadas', () => {
    const r = proximaProva(PROVAS, '2026-10-01');
    expect(r?.data).toBe('2026-10-16');
    expect(r?.provas.map((p) => p.cadeiraId)).toEqual(['intr', 'soc']);
  });

  it('no próprio dia da prova, dias é zero e a prova conta como próxima', () => {
    const r = proximaProva(PROVAS, '2026-11-24');
    expect(r?.dias).toBe(0);
    expect(r?.provas).toHaveLength(1);
  });

  it('antes da primeira prova, pega a primeira', () => {
    expect(proximaProva(PROVAS, '2026-01-01')?.data).toBe('2026-09-22');
  });

  it('depois da última prova, não há próxima (undefined)', () => {
    expect(proximaProva(PROVAS, '2026-12-16')).toBeUndefined();
  });

  it('lista vazia não tem próxima', () => {
    expect(proximaProva([], '2026-10-20')).toBeUndefined();
  });
});
