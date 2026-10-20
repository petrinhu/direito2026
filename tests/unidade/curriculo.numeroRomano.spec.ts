import { describe, expect, it } from 'vitest';
import { numeroRomano } from '@/app/curriculo/numeroRomano';

describe('numeroRomano, numeral do período na página inicial', () => {
  it.each([
    [1, 'I'],
    [2, 'II'],
    [3, 'III'],
    [4, 'IV'],
    [9, 'IX'],
    [10, 'X']
  ])('%i vira %s', (entrada, esperado) => {
    expect(numeroRomano(entrada)).toBe(esperado);
  });

  it('recusa número fora de 1 a 39, nunca devolve texto vazio ou errado', () => {
    expect(() => numeroRomano(0)).toThrow(RangeError);
    expect(() => numeroRomano(40)).toThrow(RangeError);
    expect(() => numeroRomano(2.5)).toThrow(RangeError);
  });
});
