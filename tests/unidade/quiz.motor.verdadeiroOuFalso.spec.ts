import { describe, expect, it } from 'vitest';
import { corrigirResposta, embaralharRodada } from '@/core/quiz/motor';
import { ROTULOS_CATEGORIA_QUIZ } from '@/core/quiz/rotulosCategoria';
import { mostrarLetras } from '@/core/quiz/rotuloAlternativa';
import type { PerguntaQuiz } from '@/core/unidade/tipos';

const quatro = (id: number): PerguntaQuiz => ({
  id,
  categoria: 'teoria',
  enunciadoHtml: `Pergunta ${id}`,
  alternativasHtml: ['a', 'b', 'c', 'd'],
  correta: 2,
  fonteExtra: false,
  explicacaoHtml: 'porque c'
});

const vf = (id: number, correta: boolean, extra: Partial<PerguntaQuiz> = {}): PerguntaQuiz =>
  ({
    id,
    tipo: 'verdadeiro-ou-falso',
    categoria: 'antiga',
    enunciadoHtml: `Afirmação ${id}`,
    correta,
    fonteExtra: false,
    explicacaoHtml: 'porque sim',
    ...extra
  }) as PerguntaQuiz;

describe('motor, pergunta de verdadeiro ou falso', () => {
  it('as alternativas são sempre Verdadeiro e Falso, nessa ordem, com qualquer semente', () => {
    for (const semente of [1, 2, 3, 42, 999, 123456]) {
      const rodada = embaralharRodada([vf(1, true), vf(2, false), quatro(3)], semente);
      for (const p of rodada.perguntas.filter((x) => x.tipo === 'verdadeiro-ou-falso')) {
        expect(p.alternativasHtml, `semente ${semente}, id ${p.id}`).toEqual([
          'Verdadeiro',
          'Falso'
        ]);
      }
    }
  });

  it('correta verdadeira aponta o índice 0 e falsa o índice 1, sem depender da semente', () => {
    for (const semente of [1, 7, 500]) {
      const rodada = embaralharRodada([vf(1, true), vf(2, false)], semente);
      expect(rodada.perguntas.find((p) => p.id === 1)!.indiceCorreto).toBe(0);
      expect(rodada.perguntas.find((p) => p.id === 2)!.indiceCorreto).toBe(1);
    }
  });

  it('corrigirResposta acerta Verdadeiro (0) e Falso (1) conforme a pergunta', () => {
    const rodada = embaralharRodada([vf(1, true), vf(2, false)], 5);
    const p1 = rodada.perguntas.find((p) => p.id === 1)!;
    const p2 = rodada.perguntas.find((p) => p.id === 2)!;
    expect(corrigirResposta(p1, 0)).toBe(true);
    expect(corrigirResposta(p1, 1)).toBe(false);
    expect(corrigirResposta(p2, 1)).toBe(true);
    expect(corrigirResposta(p2, 0)).toBe(false);
  });

  it('a pergunta em si entra no sorteio da ordem das perguntas', () => {
    const conjunto = [vf(1, true), vf(2, false), vf(3, true), vf(4, false), vf(5, true)];
    const ordens = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map((s) =>
        embaralharRodada(conjunto, s)
          .perguntas.map((p) => p.id)
          .join(',')
      )
    );
    expect(ordens.size).toBeGreaterThan(1);
  });

  it('propaga a origem do professor e a marca do caderno, e só quando existem', () => {
    const rodada = embaralharRodada(
      [vf(1, true, { origem: 'professor' }), vf(2, true, { gabaritoDoCaderno: true }), vf(3, true)],
      3
    );
    const por = (id: number) => rodada.perguntas.find((p) => p.id === id)!;
    expect(por(1).origem).toBe('professor');
    expect(por(2).gabaritoDoCaderno).toBe(true);
    expect('origem' in por(3)).toBe(false);
    expect('gabaritoDoCaderno' in por(3)).toBe(false);
  });

  it('a pergunta de quatro alternativas não ganha tipo nem origem na rodada', () => {
    const rodada = embaralharRodada([quatro(1)], 9);
    expect('tipo' in rodada.perguntas[0]!).toBe(false);
    expect('origem' in rodada.perguntas[0]!).toBe(false);
  });

  it('as perguntas de quatro alternativas, sozinhas, seguem a ordem congelada da semente antiga', () => {
    const rodada = embaralharRodada([quatro(1), quatro(2), quatro(3)], 42);
    const congelada = embaralharRodada([quatro(1), quatro(2), quatro(3)], 42);
    expect(rodada).toEqual(congelada);
    for (const p of rodada.perguntas) expect(p.alternativasHtml).toHaveLength(4);
  });

  it('verdadeiro ou falso não mostra letras (duas alternativas)', () => {
    expect(mostrarLetras(2)).toBe(false);
  });
});

describe('rótulos das categorias novas de Filosofia Jurídica', () => {
  it('antiga, media e revisao têm rótulo próprio', () => {
    expect(ROTULOS_CATEGORIA_QUIZ.antiga).toBe('Idade Antiga');
    expect(ROTULOS_CATEGORIA_QUIZ.media).toBe('Idade Média');
    expect(ROTULOS_CATEGORIA_QUIZ.revisao).toBe('Revisão do professor');
  });
});
