import { describe, expect, it } from 'vitest';
import { compor } from '@/core/restrito/composicaoSlide';
import type { Slide } from '@/core/restrito/tipos';

const notas = 'n';
const topicos = (id: number, itens: string[]): Slide => ({
  id,
  layout: 'topicos',
  titulo: 't',
  itens,
  notas
});

describe('composição do slide a partir dos dados', () => {
  it('itens que começam com número ou percentual viram contadores', () => {
    const c = compor(
      topicos(3, ['95% dos casos fictícios', '39,0% de outros', '77,5% de mais', 'Sem número aqui'])
    );
    expect(c.tipo).toBe('estatisticas');
    expect(c.itens.slice(0, 3).map((i) => i.numero)).toEqual(['95%', '39,0%', '77,5%']);
    expect(c.itens[0]!.corpo).toBe('dos casos fictícios');
    expect(c.itens[3]!.numero).toBeUndefined();
  });

  it('um único número não basta para o layout de contadores', () => {
    expect(compor(topicos(3, ['10 itens fictícios', 'Outro item fictício'])).tipo).not.toBe(
      'estatisticas'
    );
  });

  it('número ordinal colado (5º) não é contador', () => {
    const c = compor(topicos(3, ['5º artigo fictício', '7º artigo fictício']));
    expect(c.itens.every((i) => i.numero === undefined)).toBe(true);
  });

  it('todos os itens com "rótulo: texto": trilhas nos primeiros slides, mosaico nos demais', () => {
    const itens = ['Dentro: a', 'Fora: b', 'Fora: c'];
    expect(compor(topicos(2, itens)).tipo).toBe('trilhas');
    expect(compor(topicos(6, itens)).tipo).toBe('mosaico');
    expect(compor(topicos(2, itens)).itens[0]!.rotulo).toBe('Dentro');
    expect(compor(topicos(2, itens)).itens[0]!.corpo).toBe('a');
  });

  it('Dentro é verde-água e Fora é coral', () => {
    const c = compor(topicos(2, ['Dentro: a', 'Fora: b']));
    expect(c.itens.map((i) => i.cor)).toEqual(['menta', 'coral']);
  });

  it('sem rótulos: linha do tempo em id par e grade em id ímpar', () => {
    expect(compor(topicos(4, ['um', 'dois'])).tipo).toBe('linha');
    expect(compor(topicos(5, ['um', 'dois'])).tipo).toBe('grade');
  });

  it('rótulo muito longo não é rótulo', () => {
    const longo = `${'x'.repeat(60)}: texto`;
    expect(compor(topicos(2, [longo, longo])).itens[0]!.rotulo).toBeUndefined();
  });

  it('cada slide tem um acento, e slides vizinhos têm acentos diferentes', () => {
    const a = compor(topicos(2, ['um', 'dois'])).acento;
    const b = compor(topicos(3, ['um', 'dois'])).acento;
    expect(a).not.toBe(b);
  });

  it('comparativo: uma cor por coluna, de 2 e de 3 colunas', () => {
    const col = (n: number): Slide => ({
      id: 7,
      layout: 'comparativo',
      titulo: 't',
      notas,
      colunas: Array.from({ length: n }, (_, i) => ({ titulo: `c${i}`, itens: ['a'] }))
    });
    const tres = compor(col(3)).colunas.map((c) => c.cor);
    const duas = compor(col(2)).colunas.map((c) => c.cor);
    expect(new Set(tres).size).toBe(3);
    expect(new Set(duas).size).toBe(2);
  });

  it('capa, destaque e encerramento mantêm o próprio tipo', () => {
    for (const layout of ['capa', 'destaque', 'fotos', 'encerramento'] as const) {
      expect(compor({ id: 1, layout, titulo: 't', notas }).tipo).toBe(layout);
    }
  });
});
