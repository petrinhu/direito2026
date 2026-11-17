import { describe, expect, it } from 'vitest';
import { dimsRepouso, fatiasRepouso, razaoDoVoo } from '@/core/piramide3d/geometria';

/**
 * Forma das fatias comuns no voo (A/B de 17/11, 1920 claro): a 1.15.3.0 voava as fatias comuns com a razão
 * de 0,84 (topo/base). A razão de repouso de cada nível (LT/LB) só vale para a ponta, que é o topo fechado.
 */
describe('razão de topo/base no voo', () => {
  const fatias = fatiasRepouso(5).map(dimsRepouso);
  const comum = fatias[1]!;
  const ponta = fatias[4]!;

  it('a fatia comum voa com a razão da peça (0,84), não com a razão de repouso do nível', () => {
    expect(razaoDoVoo(comum, 0.84)).toBe(0.84);
  });

  it('a ponta voa com a razão de repouso (topo quase fechado)', () => {
    expect(razaoDoVoo(ponta, 0)).toBeCloseTo(ponta.LT / ponta.LB, 9);
    expect(razaoDoVoo(ponta, 0)).toBeLessThan(0.05);
  });
});
