import { describe, expect, it } from 'vitest';
import { deveBuscarNoTextoIntegral } from '@/core/busca/gatilhoTextoIntegral';

/**
 * EP-F11-BUSCA-TETO: o índice do texto integral só desce quando a busca
 * principal não acha nada. Esta regra decide esse disparo, então tem teste.
 */
describe('deveBuscarNoTextoIntegral: quando o índice do texto integral desce', () => {
  it('busca principal sem resultado e termo preenchido dispara', () => {
    expect(deveBuscarNoTextoIntegral('geografia', 0)).toBe(true);
  });

  it('busca principal com resultado não dispara (o texto só desce pelo botão)', () => {
    expect(deveBuscarNoTextoIntegral('direito', 3)).toBe(false);
  });

  it('termo vazio ou só espaços não dispara', () => {
    expect(deveBuscarNoTextoIntegral('', 0)).toBe(false);
    expect(deveBuscarNoTextoIntegral('   ', 0)).toBe(false);
  });
});
