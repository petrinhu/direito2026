import { describe, expect, it } from 'vitest';
import {
  CHAVE_ESTADO_QUADRO_PROVA,
  gravarMinimizado,
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
