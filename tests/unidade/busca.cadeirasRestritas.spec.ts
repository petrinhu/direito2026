import { describe, expect, it } from 'vitest';
import { montarDocumentosCadeirasRestritas } from '@/core/busca/montarIndice';
import { curriculo } from '@/conteudo/curriculo';
import type { Curriculo } from '@/core/curriculo/tipos';

describe('busca e cadeira restrita: só o título navegável', () => {
  it('gera um documento com o título e o endereço, e nenhum conteúdo', () => {
    const docs = montarDocumentosCadeirasRestritas(curriculo);
    expect(docs).toHaveLength(1);
    const d = docs[0]!;
    expect(d.url).toBe('/p/p1/interdisciplinar');
    expect(d.titulo).toBe('Interdisciplinar');
    expect(d.corpo).toBe('Interdisciplinar');
    expect(d.unidade).toBe('');
  });

  it('ignora cadeira comum e cadeira restrita em breve', () => {
    const c: Curriculo = [
      {
        id: 'p1',
        numero: 1,
        rotulo: '1',
        cadeiras: [
          { id: 'a', nome: 'A', estado: 'publicado', unidades: [] },
          { id: 'b', nome: 'B', estado: 'em-breve', restrita: true, unidades: [] }
        ]
      }
    ];
    expect(montarDocumentosCadeirasRestritas(c)).toEqual([]);
  });
});
