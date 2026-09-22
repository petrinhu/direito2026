import { describe, expect, it } from 'vitest';
import { resolverRota } from '@/core/curriculo/resolverRota';
import type { Curriculo } from '@/core/curriculo/tipos';

function curriculoDeTeste(): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1o período',
      cadeiras: [
        {
          id: 'intr-direito',
          nome: 'Introdução ao Direito',
          estado: 'publicado',
          unidades: [
            {
              id: 'u1',
              rotulo: 'Unidade 1',
              titulo: 'Conceito e fontes do Direito',
              estado: 'publicado',
              abas: ['resumo', 'peticao', 'quiz'],
              carregar: async () => ({
                meta: { titulo: 't', subtitulo: 's', descricao: 'd' },
                resumo: []
              })
            },
            {
              id: 'u2',
              rotulo: 'Unidade 2',
              titulo: 'Unidade 2',
              estado: 'em-breve',
              abas: []
            }
          ]
        }
      ]
    },
    {
      id: 'p2',
      numero: 2,
      rotulo: '2o período',
      cadeiras: []
    }
  ];
}

describe('resolverRota', () => {
  it('resolve uma unidade publicada com aba explícita', () => {
    const r = resolverRota(curriculoDeTeste(), '/p/p1/intr-direito/u1/quiz');
    expect(r.tipo).toBe('encontrado');
    if (r.tipo === 'encontrado') {
      expect(r.periodo.id).toBe('p1');
      expect(r.cadeira.id).toBe('intr-direito');
      expect(r.unidade.id).toBe('u1');
      expect(r.aba).toBe('quiz');
    }
  });

  it('sem aba na URL, cai para resumo por padrão', () => {
    const r = resolverRota(curriculoDeTeste(), '/p/p1/intr-direito/u1');
    expect(r.tipo).toBe('encontrado');
    if (r.tipo === 'encontrado') expect(r.aba).toBe('resumo');
  });

  it('aba pedida que a unidade não tem cai para resumo', () => {
    const r = resolverRota(curriculoDeTeste(), '/p/p1/intr-direito/u2/quiz');
    // u2 é em-breve e não tem abas: não pode "encontrar" uma aba inexistente
    expect(r.tipo).toBe('em-breve');
  });

  it('unidade em-breve devolve em-breve, não inexistente', () => {
    const r = resolverRota(curriculoDeTeste(), '/p/p1/intr-direito/u2');
    expect(r.tipo).toBe('em-breve');
    if (r.tipo === 'em-breve') {
      expect(r.unidade?.id).toBe('u2');
      expect(r.cadeira?.id).toBe('intr-direito');
    }
  });

  it('cadeira sem nenhuma unidade devolve em-breve no nível da cadeira', () => {
    const r = resolverRota(curriculoDeTeste(), '/p/p2');
    expect(r.tipo).toBe('em-breve');
    if (r.tipo === 'em-breve') {
      expect(r.periodo.id).toBe('p2');
      expect(r.cadeira).toBeUndefined();
    }
  });

  it('período inexistente devolve inexistente', () => {
    const r = resolverRota(curriculoDeTeste(), '/p/p9');
    expect(r.tipo).toBe('inexistente');
  });

  it('cadeira inexistente dentro de período real devolve inexistente', () => {
    const r = resolverRota(curriculoDeTeste(), '/p/p1/nao-existe');
    expect(r.tipo).toBe('inexistente');
  });

  it('unidade inexistente dentro de cadeira real devolve inexistente', () => {
    const r = resolverRota(curriculoDeTeste(), '/p/p1/intr-direito/u9');
    expect(r.tipo).toBe('inexistente');
  });

  it('barra final é tolerada', () => {
    const r = resolverRota(curriculoDeTeste(), '/p/p1/intr-direito/u1/');
    expect(r.tipo).toBe('encontrado');
  });
});
