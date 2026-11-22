import { describe, expect, it } from 'vitest';
import {
  formatarDataHora,
  formatarFalhaDeEnvio,
  formatarHora,
  formatarPrazo,
  normalizarHora24
} from '@/core/calendario/dataHora';

/**
 * ADM-F1 (último login no painel): data e hora em dd/mm/aaaa HH:MM:SS, no fuso do calendário
 * (America/Recife, UTC-3, sem horário de verão), não no fuso do navegador.
 */
describe('formatarDataHora', () => {
  it('converte para o fuso de Recife e formata dd/mm/aaaa HH:MM:SS', () => {
    expect(formatarDataHora('2026-11-14T15:04:29+00:00')).toBe('14/11/2026 12:04:29');
  });

  it('vira o dia pelo fuso de Recife (02:30Z de 15/11 é 23:30 de 14/11)', () => {
    expect(formatarDataHora('2026-11-15T02:30:00Z')).toBe('14/11/2026 23:30:00');
  });

  it('meia-noite sai como 00, nunca como 24 (armadilha do motor do Chrome)', () => {
    expect(formatarDataHora('2026-11-15T03:00:00Z')).toBe('15/11/2026 00:00:00');
  });

  it('15:00Z dá 12:00:00 no mesmo dia', () => {
    expect(formatarDataHora('2026-11-15T15:00:00Z')).toBe('15/11/2026 12:00:00');
  });

  it('sem valor (null) mostra "Nunca"', () => {
    expect(formatarDataHora(null)).toBe('Nunca');
  });

  it('texto que não é data volta igual, como hoje no painel', () => {
    expect(formatarDataHora('não é uma data')).toBe('não é uma data');
  });
});

/**
 * C-8: a coluna "Atualizado às" usa só a hora (HH:MM:SS), no fuso de Recife. Função própria, para
 * o painel não depender de cortar o fim de uma data completa.
 */
describe('formatarHora', () => {
  it('dá HH:MM:SS no fuso de Recife, com o instante perto da meia-noite UTC (02:30Z é 23:30)', () => {
    expect(formatarHora(new Date('2026-11-15T02:30:00Z'))).toBe('23:30:00');
  });

  it('meia-noite de Recife sai como 00:00:00, nunca 24', () => {
    expect(formatarHora(new Date('2026-11-15T03:00:00Z'))).toBe('00:00:00');
  });
});

/**
 * ADM-FUSO-PRAZO: o prazo do convite e a falha de envio saem em dd/mm hh:mm no fuso de Recife, como o
 * último login. Os instantes ficam perto da meia-noite UTC, para o dia virar só pelo fuso.
 */
describe('formatarPrazo', () => {
  it('epoch em segundos vira dd/mm hh:mm no fuso de Recife (02:30Z de 15/11 é 23:30 de 14/11)', () => {
    expect(formatarPrazo(Date.UTC(2026, 10, 15, 2, 30) / 1000)).toBe('14/11 23:30');
  });

  it('sem valor, ou valor que não é número: vazio', () => {
    expect(formatarPrazo(null)).toBe('');
    expect(formatarPrazo(undefined)).toBe('');
    expect(formatarPrazo(Number.NaN)).toBe('');
  });
});

describe('formatarFalhaDeEnvio', () => {
  it('instante ISO vira dd/mm hh:mm no fuso de Recife', () => {
    expect(formatarFalhaDeEnvio('2026-11-15T02:30:00Z')).toBe('14/11 23:30');
  });

  it('sem valor, ou valor que não é data: vazio', () => {
    expect(formatarFalhaDeEnvio(null)).toBe('');
    expect(formatarFalhaDeEnvio(undefined)).toBe('');
    expect(formatarFalhaDeEnvio('não é data')).toBe('');
  });
});

describe('normalizarHora24', () => {
  it('troca 24 por 00 e deixa as demais horas como estão', () => {
    expect(normalizarHora24('24')).toBe('00');
    expect(normalizarHora24('00')).toBe('00');
    expect(normalizarHora24('23')).toBe('23');
  });
});
