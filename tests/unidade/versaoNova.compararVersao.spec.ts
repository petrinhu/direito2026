import { describe, expect, it } from 'vitest';
import { compararVersao } from '@/core/versaoNova/compararVersao';

/**
 * Comparação de versão (AV-F2, decisão D1). Igual ou diferente é a regra da aba: qualquer
 * diferença vale aviso, inclusive rollback. A ordem só serve para decidir se há lista.
 */
describe('compararVersao', () => {
  it('versões iguais', () => {
    expect(compararVersao('1.11.0.0', '1.11.0.0')).toBe('igual');
  });

  it('publicada mais nova que a da aba', () => {
    expect(compararVersao('1.10.1.0', '1.11.0.0')).toBe('publicada-mais-nova');
  });

  it('publicada mais velha que a da aba (rollback)', () => {
    expect(compararVersao('1.11.0.0', '1.10.2.0')).toBe('publicada-mais-velha');
  });

  it('compara por partes numéricas', () => {
    expect(compararVersao('1.10.9.0', '1.10.10.0')).toBe('publicada-mais-nova');
  });

  it('formato fora de A.B.C.D não vale informação', () => {
    expect(compararVersao('abc', '1.0.0.0')).toBe('invalida');
    expect(compararVersao('1.0.0.0', '')).toBe('invalida');
  });
});
