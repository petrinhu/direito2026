import { describe, expect, it } from 'vitest';
import { rotas } from '@/app/router/rotas';

/**
 * Só a página inicial pede a faixa de topo (LayoutBase, prop comFaixa). A
 * marca vive na meta da rota, para o App ler sem conhecer nomes de página.
 */
describe('rotas, faixa de topo só na página inicial', () => {
  it('a rota home marca faixaDeTopo', () => {
    const home = rotas.find((r) => r.name === 'home');
    expect(home?.meta?.faixaDeTopo).toBe(true);
  });

  it('nenhuma outra rota pede a faixa', () => {
    const outras = rotas.filter((r) => r.name !== 'home');
    expect(outras.length).toBeGreaterThan(0);
    expect(outras.some((r) => r.meta?.faixaDeTopo === true)).toBe(false);
  });
});
