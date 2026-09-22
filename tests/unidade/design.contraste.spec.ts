import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';

describe('calcularContraste', () => {
  it('preto sobre branco dá o contraste máximo, 21:1', () => {
    expect(calcularContraste('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('uma cor contra ela mesma dá 1:1 (o próprio bug da lateral)', () => {
    expect(calcularContraste('#0b1a2c', '#0b1a2c')).toBeCloseTo(1, 5);
  });

  it('é simétrico: a ordem dos dois argumentos não muda o resultado', () => {
    expect(calcularContraste('#1c1c1c', '#faf9f5')).toBeCloseTo(
      calcularContraste('#faf9f5', '#1c1c1c'),
      5
    );
  });
});
