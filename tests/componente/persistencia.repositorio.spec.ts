// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarRepositorioProgresso } from '@/app/persistencia/criarRepositorioProgresso';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';

describe('criarRepositorioProgresso, localStorage saudável', () => {
  it('grava e lê de volta um registro', () => {
    const repo = criarRepositorioProgresso();
    const registro = {
      versao: 1 as const,
      atualizadoEm: 't0',
      blocosLidos: ['bloco-1'],
      ultimaAba: 'resumo' as const
    };
    expect(repo.salvar('p1/intr-direito/u1', registro)).toBe(true);
    expect(repo.ler('p1/intr-direito/u1')).toEqual(registro);
  });

  it('registro com versão desconhecida é descartado sem lançar', () => {
    localStorage.setItem(
      'caderno-direito:v1:progresso:p1/intr-direito/u1',
      JSON.stringify({ versao: 99, atualizadoEm: 't0', blocosLidos: [], ultimaAba: 'resumo' })
    );
    const repo = criarRepositorioProgresso();
    expect(() => repo.ler('p1/intr-direito/u1')).not.toThrow();
    expect(repo.ler('p1/intr-direito/u1')).toBeUndefined();
  });

  it('registro corrompido (JSON inválido) é descartado sem lançar', () => {
    localStorage.setItem('caderno-direito:v1:progresso:p1/intr-direito/u1', '{ isto nao é json');
    const repo = criarRepositorioProgresso();
    expect(() => repo.ler('p1/intr-direito/u1')).not.toThrow();
    expect(repo.ler('p1/intr-direito/u1')).toBeUndefined();
  });
});

describe('criarRepositorioProgresso, localStorage indisponível (Safari privado)', () => {
  let setItemOriginal: typeof Storage.prototype.setItem;

  beforeEach(() => {
    setItemOriginal = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException('QuotaExceededError');
    };
  });

  afterEach(() => {
    Storage.prototype.setItem = setItemOriginal;
  });

  it('a sonda falha, o repositório cai para memória e o site continua funcionando', () => {
    const repo = criarRepositorioProgresso();
    const registro = {
      versao: 1 as const,
      atualizadoEm: 't0',
      blocosLidos: ['bloco-1'],
      ultimaAba: 'resumo' as const
    };
    expect(() => repo.salvar('p1/intr-direito/u1', registro)).not.toThrow();
    expect(repo.salvar('p1/intr-direito/u1', registro)).toBe(true);
    expect(repo.ler('p1/intr-direito/u1')).toEqual(registro);
  });
});

describe('RepositorioMemoria', () => {
  it('funciona sozinho, sem localStorage nenhum', () => {
    const repo = new RepositorioMemoria();
    expect(repo.ler('x')).toBeUndefined();
    const registro = {
      versao: 1 as const,
      atualizadoEm: 't0',
      blocosLidos: [],
      ultimaAba: 'resumo' as const
    };
    repo.salvar('x', registro);
    expect(repo.ler('x')).toEqual(registro);
  });

  it('tema: lê undefined quando nunca foi salvo, e o valor salvo depois', () => {
    const repo = new RepositorioMemoria();
    expect(repo.lerTema()).toBeUndefined();
    repo.salvarTema('escuro');
    expect(repo.lerTema()).toBe('escuro');
  });
});
