import { describe, expect, it } from 'vitest';
import { nivelUrgencia } from '@/core/calendario/urgencia';

/**
 * Faixas da ordem do líder (20/10/2026): calmo com mais de 14 dias, dourado
 * de 7 a 14, garnet de 3 a 6, pulsando com 2 ou menos. Os limites são os
 * pontos onde a cor muda, então cada um é testado nos dois lados.
 */
describe('nivelUrgencia', () => {
  it.each([
    [40, 'calmo'],
    [15, 'calmo'],
    [14, 'dourado'],
    [7, 'dourado'],
    [6, 'garnet'],
    [3, 'garnet'],
    [2, 'pulsante'],
    [1, 'pulsante'],
    [0, 'pulsante']
  ])('%i dia(s) -> %s', (dias, esperado) => {
    expect(nivelUrgencia(dias)).toBe(esperado);
  });

  it('recusa dias negativos (prova já passou não tem contagem)', () => {
    expect(() => nivelUrgencia(-1)).toThrow();
  });
});
