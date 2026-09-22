// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';

describe('criarStoreModoAdaptado', () => {
  it('começa desligada, alternar() liga e grava no repositório', () => {
    const repo = new RepositorioMemoria();
    const espiao = vi.spyOn(repo, 'salvarModoAdaptado');
    const store = criarStoreModoAdaptado(repo);

    expect(store.ativo.value).toBe(false);
    expect(document.documentElement.hasAttribute('data-modo-adaptado')).toBe(false);

    store.alternar();

    expect(store.ativo.value).toBe(true);
    expect(espiao).toHaveBeenCalledWith(true);
    expect(document.documentElement.getAttribute('data-modo-adaptado')).toBe('on');

    store.alternar();

    expect(store.ativo.value).toBe(false);
    expect(espiao).toHaveBeenCalledWith(false);
    expect(document.documentElement.hasAttribute('data-modo-adaptado')).toBe(false);
  });

  it('uma segunda instância criada depois de salvarModoAdaptado(true) já nasce ligada', () => {
    const repo = new RepositorioMemoria();
    repo.salvarModoAdaptado(true);
    const store = criarStoreModoAdaptado(repo);
    expect(store.ativo.value).toBe(true);
  });
});
