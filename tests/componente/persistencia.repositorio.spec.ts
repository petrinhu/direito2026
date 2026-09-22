// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

/**
 * Ordem do líder, 22/09/2026, verbatim (faixa de armazenamento): "se o
 * armazenamento estiver indisponível... o aviso não pode entrar em laço
 * aparecendo a cada página; nesse caso mostre uma vez por sessão e não
 * tente gravar." E: "um link para apagar os dados guardados, que limpa
 * progresso e tema e devolve o site ao estado inicial".
 */
describe('aviso de armazenamento visto, e limparTudo, sobre localStorage saudável', () => {
  // localStorage real do jsdom persiste entre testes do mesmo arquivo (só
  // um "navegador" para o arquivo inteiro): sem isto, um teste anterior
  // que marcou o aviso como visto vazaria "true" para o teste seguinte
  // que espera "nunca visto".
  beforeEach(() => localStorage.clear());

  it('nunca visto: lê false (aparece na primeira visita)', () => {
    const repo = criarRepositorioProgresso();
    expect(repo.lerAvisoArmazenamentoVisto()).toBe(false);
  });

  it('depois de marcado, uma NOVA leitura (nova "visita") lê true (não aparece na segunda)', () => {
    const repo = criarRepositorioProgresso();
    expect(repo.marcarAvisoArmazenamentoVisto()).toBe(true);
    // Nova instância simula reabrir o site (novo carregamento de página).
    const repoDaProximaVisita = criarRepositorioProgresso();
    expect(repoDaProximaVisita.lerAvisoArmazenamentoVisto()).toBe(true);
  });

  it('limparTudo apaga progresso, tema e a marca do aviso', () => {
    const repo = criarRepositorioProgresso();
    repo.salvar('p1/intr-direito/u1', {
      versao: 1,
      atualizadoEm: 't0',
      blocosLidos: ['bloco-1'],
      ultimaAba: 'resumo'
    });
    repo.salvarTema('escuro');
    repo.marcarAvisoArmazenamentoVisto();

    repo.limparTudo();

    expect(repo.ler('p1/intr-direito/u1')).toBeUndefined();
    expect(repo.lerTema()).toBeUndefined();
    expect(repo.lerAvisoArmazenamentoVisto()).toBe(false);
  });
});

describe('aviso de armazenamento, localStorage indisponível', () => {
  it('marcar visto na mesma sessão não entra em laço, mas não sobrevive a outra sessão (nunca tenta gravar de verdade)', () => {
    const repo = new RepositorioMemoria();
    expect(repo.lerAvisoArmazenamentoVisto()).toBe(false);
    expect(repo.marcarAvisoArmazenamentoVisto()).toBe(true);
    // Mesma instância (mesma sessão): continua visto, sem laço.
    expect(repo.lerAvisoArmazenamentoVisto()).toBe(true);

    // Nova instância (nova sessão, armazenamento ainda indisponível):
    // volta a false, porque nunca havia sido gravado de verdade.
    const repoDeOutraSessao = new RepositorioMemoria();
    expect(repoDeOutraSessao.lerAvisoArmazenamentoVisto()).toBe(false);
  });

  it('limparTudo em memória também limpa progresso, tema e o aviso', () => {
    const repo = new RepositorioMemoria();
    repo.salvar('p1/intr-direito/u1', {
      versao: 1,
      atualizadoEm: 't0',
      blocosLidos: ['bloco-1'],
      ultimaAba: 'resumo'
    });
    repo.salvarTema('escuro');
    repo.marcarAvisoArmazenamentoVisto();

    repo.limparTudo();

    expect(repo.ler('p1/intr-direito/u1')).toBeUndefined();
    expect(repo.lerTema()).toBeUndefined();
    expect(repo.lerAvisoArmazenamentoVisto()).toBe(false);
  });
});
