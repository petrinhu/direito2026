import { describe, expect, it } from 'vitest';
import { itensDaCadeira } from '@/core/curriculo/itensDaCadeira';
import type { Cadeira, ReferenciaUnidade } from '@/core/curriculo/tipos';

const u1: ReferenciaUnidade = {
  id: 'u1',
  rotulo: 'AV1',
  titulo: 'Simples',
  estado: 'publicado',
  abas: ['resumo']
};
const textura: ReferenciaUnidade = {
  id: 'u3-livro-textura',
  rotulo: 'AV3',
  titulo: 'Textura',
  estado: 'publicado',
  abas: ['resumo']
};

function cadeira(grupos: Cadeira['grupos'], unidades: readonly ReferenciaUnidade[]): Cadeira {
  return { id: 'cad', nome: 'Cad', estado: 'publicado', unidades, grupos };
}

describe('itensDaCadeira', () => {
  it('unidade simples vira item de unidade; AV com grupos vira item AV, em ordem de número', () => {
    const itens = itensDaCadeira(
      cadeira(
        [
          { unidade: 'u3', id: 'livro', rotulo: 'Livro' },
          { unidade: 'u3', id: 'material', rotulo: 'Material de estudo' }
        ],
        [u1, textura]
      )
    );
    expect(itens).toEqual([
      { tipo: 'unidade', chave: 'u1', unidade: u1 },
      {
        tipo: 'av',
        chave: 'av-3',
        numero: 3,
        rotulo: 'AV3',
        grupos: [
          { id: 'livro', rotulo: 'Livro', topicos: [textura] },
          { id: 'material', rotulo: 'Material de estudo', topicos: [] }
        ]
      }
    ]);
  });

  it('a AV existe mesmo sem tópico, se houver grupo declarado (grupo sem tópico = em breve)', () => {
    const itens = itensDaCadeira(
      cadeira([{ unidade: 'u3', id: 'material', rotulo: 'Material de estudo' }], [])
    );
    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({
      tipo: 'av',
      numero: 3,
      grupos: [{ id: 'material', topicos: [] }]
    });
  });

  it('os grupos saem na ordem em que foram declarados, não na ordem alfabética', () => {
    const itens = itensDaCadeira(
      cadeira(
        [
          { unidade: 'u3', id: 'material', rotulo: 'Material de estudo' },
          { unidade: 'u3', id: 'livro', rotulo: 'Livro' }
        ],
        [textura]
      )
    );
    const av = itens[0];
    expect(av?.tipo === 'av' ? av.grupos.map((g) => g.id) : []).toEqual(['material', 'livro']);
  });

  it('sem grupo nenhum, cada unidade é um item próprio', () => {
    expect(itensDaCadeira(cadeira(undefined, [u1]))).toEqual([
      { tipo: 'unidade', chave: 'u1', unidade: u1 }
    ]);
  });
});
