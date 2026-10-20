import { describe, expect, it } from 'vitest';
import {
  dataIsoNoFuso,
  diasEntre,
  ehDataIso,
  FUSO_CALENDARIO,
  mesDe
} from '@/core/calendario/datas';

describe('dataIsoNoFuso', () => {
  it('usa o fuso de Recife: 02:30 UTC do dia 20 ainda é dia 19 em Recife', () => {
    expect(dataIsoNoFuso(new Date('2026-10-20T02:30:00Z'))).toBe('2026-10-19');
  });

  it('a meia-noite de Recife é 03:00 UTC (sem horário de verão)', () => {
    expect(dataIsoNoFuso(new Date('2026-10-20T03:00:00Z'))).toBe('2026-10-20');
    expect(dataIsoNoFuso(new Date('2026-10-20T02:59:59Z'))).toBe('2026-10-19');
  });

  it('o fuso padrão é America/Recife', () => {
    expect(FUSO_CALENDARIO).toBe('America/Recife');
  });

  it('aceita um fuso explícito', () => {
    expect(dataIsoNoFuso(new Date('2026-10-20T02:30:00Z'), 'UTC')).toBe('2026-10-20');
  });
});

describe('diasEntre conta dias de calendário', () => {
  it('mesmo dia é zero', () => {
    expect(diasEntre('2026-10-20', '2026-10-20')).toBe(0);
  });

  it('de 20/10 a 24/11 são 35 dias', () => {
    expect(diasEntre('2026-10-20', '2026-11-24')).toBe(35);
  });

  it('atravessa a virada do ano', () => {
    expect(diasEntre('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('é negativo quando a data de destino é anterior', () => {
    expect(diasEntre('2026-10-20', '2026-10-16')).toBe(-4);
  });
});

describe('ehDataIso e mesDe', () => {
  it('aceita só AAAA-MM-DD válido', () => {
    expect(ehDataIso('2026-10-20')).toBe(true);
    expect(ehDataIso('2026-13-01')).toBe(false);
    expect(ehDataIso('20/10/2026')).toBe(false);
    expect(ehDataIso('2026-10-20T00:00')).toBe(false);
  });

  it('extrai o mês AAAA-MM', () => {
    expect(mesDe('2026-10-20')).toBe('2026-10');
  });
});
