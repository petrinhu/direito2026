import { describe, expect, it } from 'vitest';
import { rotas } from '@/app/router/rotas';

/**
 * Ordem do líder: /usuarios (gerenciar usuários, só admin) e /conta (trocar senha)
 * são endereços da própria aplicação. Antes do catch-all, senão caem em não encontrado.
 */
describe('rotas /usuarios e /conta', () => {
  const indice = (caminho: string) => rotas.findIndex((r) => r.path === caminho);
  const CATCH_ALL = '/:pathMatch(.*)*';

  it('/usuarios existe com o nome usuarios', () => {
    const rota = rotas[indice('/usuarios')];
    expect(rota?.name).toBe('usuarios');
  });

  it('/conta existe com o nome conta', () => {
    const rota = rotas[indice('/conta')];
    expect(rota?.name).toBe('conta');
  });

  it('as duas vêm antes do catch-all de não encontrado', () => {
    const fim = indice(CATCH_ALL);
    expect(fim).toBeGreaterThan(-1);
    expect(indice('/usuarios')).toBeLessThan(fim);
    expect(indice('/conta')).toBeLessThan(fim);
  });
});
