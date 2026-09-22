// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { criarStoreTema } from '@/app/stores/tema';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';

describe('criarStoreTema', () => {
  it('ciclo sistema -> claro -> escuro -> sistema, com persistência chamada a cada troca', () => {
    const repo = new RepositorioMemoria();
    const espiao = vi.spyOn(repo, 'salvarTema');
    const store = criarStoreTema(repo);

    expect(store.tema.value).toBe('sistema');

    store.alternar();
    expect(store.tema.value).toBe('claro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    store.alternar();
    expect(store.tema.value).toBe('escuro');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    store.alternar();
    expect(store.tema.value).toBe('sistema');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);

    expect(espiao).toHaveBeenCalledWith('claro');
    expect(espiao).toHaveBeenCalledWith('escuro');
    expect(espiao).toHaveBeenCalledWith('sistema');
  });

  it('começa lendo a escolha já salva no repositório', () => {
    const repo = new RepositorioMemoria();
    repo.salvarTema('escuro');
    const store = criarStoreTema(repo);
    expect(store.tema.value).toBe('escuro');
  });
});
