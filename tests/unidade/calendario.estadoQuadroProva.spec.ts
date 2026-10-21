import { describe, expect, it } from 'vitest';
import {
  CHAVE_ESTADO_QUADRO_PROVA,
  gravarEscolha,
  gravarMinimizado,
  gravarSemEscolha,
  lerEscolha,
  lerMinimizado,
  type ArmazenamentoSimples
} from '@/app/calendario/estadoQuadroProva';

function armazenamentoEmMemoria(inicial: Record<string, string> = {}): ArmazenamentoSimples {
  const dados = new Map(Object.entries(inicial));
  return {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => {
      dados.set(chave, valor);
    }
  };
}

const armazenamentoQueFalha: ArmazenamentoSimples = {
  getItem: () => {
    throw new Error('armazenamento bloqueado');
  },
  setItem: () => {
    throw new Error('armazenamento bloqueado');
  }
};

describe('lerMinimizado', () => {
  it('sem nada guardado, o quadro nasce aberto', () => {
    expect(lerMinimizado(armazenamentoEmMemoria(), 'calmo')).toBe(false);
  });

  it('minimizado na mesma faixa continua minimizado', () => {
    const memoria = armazenamentoEmMemoria();
    gravarMinimizado(memoria, 'calmo', true);
    expect(lerMinimizado(memoria, 'calmo')).toBe(true);
  });

  it('minimizado numa faixa e agora outra faixa: reabre sozinho', () => {
    const memoria = armazenamentoEmMemoria();
    gravarMinimizado(memoria, 'calmo', true);
    expect(lerMinimizado(memoria, 'dourado')).toBe(false);
  });

  it('valor corrompido no armazenamento cai no padrão (aberto)', () => {
    const memoria = armazenamentoEmMemoria({ [CHAVE_ESTADO_QUADRO_PROVA]: '{não é json' });
    expect(lerMinimizado(memoria, 'calmo')).toBe(false);
  });

  it('armazenamento que lança erro não derruba o quadro (aberto)', () => {
    expect(lerMinimizado(armazenamentoQueFalha, 'calmo')).toBe(false);
  });

  it('sem armazenamento disponível (undefined), é aberto', () => {
    expect(lerMinimizado(undefined, 'calmo')).toBe(false);
  });
});

describe('gravarMinimizado', () => {
  it('desminimizar grava falso e a leitura volta aberta', () => {
    const memoria = armazenamentoEmMemoria();
    gravarMinimizado(memoria, 'garnet', true);
    gravarMinimizado(memoria, 'garnet', false);
    expect(lerMinimizado(memoria, 'garnet')).toBe(false);
  });

  it('armazenamento que lança erro é ignorado sem exceção', () => {
    expect(() => gravarMinimizado(armazenamentoQueFalha, 'calmo', true)).not.toThrow();
  });

  it('sem armazenamento disponível é ignorado sem exceção', () => {
    expect(() => gravarMinimizado(undefined, 'calmo', true)).not.toThrow();
  });
});

/**
 * Escolha da pessoa (ordem do líder, 20/10/2026): o quadro minimizado por
 * padrão, no modo adaptado até 340px, só deixa de valer quando a pessoa toca
 * em Mostrar ou Minimizar. Por isso a escolha é gravada à parte do reset
 * automático de faixa, que não conta como escolha.
 */
describe('lerEscolha, gravarEscolha e gravarSemEscolha', () => {
  it('sem nada guardado, não há escolha da pessoa', () => {
    expect(lerEscolha(armazenamentoEmMemoria(), 'calmo')).toBeUndefined();
  });

  it('escolha de mostrar (aberto) fica guardada na mesma faixa', () => {
    const memoria = armazenamentoEmMemoria();
    gravarEscolha(memoria, 'calmo', false);
    expect(lerEscolha(memoria, 'calmo')).toBe(false);
  });

  it('escolha de minimizar fica guardada na mesma faixa', () => {
    const memoria = armazenamentoEmMemoria();
    gravarEscolha(memoria, 'calmo', true);
    expect(lerEscolha(memoria, 'calmo')).toBe(true);
  });

  it('escolha de outra faixa não vale na faixa atual', () => {
    const memoria = armazenamentoEmMemoria();
    gravarEscolha(memoria, 'calmo', false);
    expect(lerEscolha(memoria, 'dourado')).toBeUndefined();
  });

  it('reset automático de faixa não conta como escolha', () => {
    const memoria = armazenamentoEmMemoria();
    gravarEscolha(memoria, 'calmo', false);
    gravarSemEscolha(memoria, 'calmo');
    expect(lerEscolha(memoria, 'calmo')).toBeUndefined();
  });

  it('formato antigo (sem o campo escolha) conta como escolha, pois só o toque o gravava', () => {
    const memoria = armazenamentoEmMemoria({
      [CHAVE_ESTADO_QUADRO_PROVA]: JSON.stringify({ minimizado: true, faixa: 'calmo' })
    });
    expect(lerEscolha(memoria, 'calmo')).toBe(true);
  });

  it('armazenamento que falha resulta em nenhuma escolha, sem lançar erro', () => {
    expect(lerEscolha(armazenamentoQueFalha, 'calmo')).toBeUndefined();
    expect(() => gravarEscolha(armazenamentoQueFalha, 'calmo', true)).not.toThrow();
  });
});
