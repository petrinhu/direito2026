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

  it('suspender() tira o atributo do <html> sem apagar a preferência salva, e voltar religa', () => {
    const repo = new RepositorioMemoria();
    const espiao = vi.spyOn(repo, 'salvarModoAdaptado');
    const store = criarStoreModoAdaptado(repo);
    store.alternar();
    espiao.mockClear();
    expect(document.documentElement.getAttribute('data-modo-adaptado')).toBe('on');

    store.suspender(true);

    expect(store.suspenso.value).toBe(true);
    expect(store.ativo.value).toBe(true);
    expect(store.efetivo.value).toBe(false);
    expect(document.documentElement.hasAttribute('data-modo-adaptado')).toBe(false);
    expect(repo.lerModoAdaptado()).toBe(true);
    expect(espiao).not.toHaveBeenCalled();

    store.suspender(false);

    expect(store.efetivo.value).toBe(true);
    expect(document.documentElement.getAttribute('data-modo-adaptado')).toBe('on');
    expect(repo.lerModoAdaptado()).toBe(true);
  });

  it('alternar() enquanto suspenso muda a preferência, mas o atributo continua fora', () => {
    const repo = new RepositorioMemoria();
    const store = criarStoreModoAdaptado(repo);
    store.suspender(true);
    store.alternar();
    expect(store.ativo.value).toBe(true);
    expect(document.documentElement.hasAttribute('data-modo-adaptado')).toBe(false);
    store.suspender(false);
    expect(document.documentElement.getAttribute('data-modo-adaptado')).toBe('on');
  });
});
