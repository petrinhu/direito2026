import { describe, expect, it } from 'vitest';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { ROTULOS_CATEGORIA_QUIZ } from '@/conteudo/quiz/categorias';
import { categoriasSemRotulo } from '@/core/quiz/categoriasSemRotulo';
import type { PerguntaQuiz } from '@/core/unidade/tipos';

/**
 * Categoria de pergunta é dado (src/conteudo/quiz/categorias.ts): quem cria
 * uma categoria nova escreve o rótulo no mesmo dado, sem tocar o código. A
 * regra é que toda categoria usada em algum quiz tenha rótulo; a varredura
 * abaixo acha todas as unidades descobertas e lista a categoria órfã.
 */
describe('categoriasSemRotulo (função pura)', () => {
  it('devolve a categoria que não tem rótulo, sem repetir', () => {
    const perguntas = [{ categoria: 'a' }, { categoria: 'b' }, { categoria: 'b' }];
    expect(categoriasSemRotulo(perguntas, { a: 'A' })).toEqual(['b']);
  });

  it('devolve lista vazia quando todas têm rótulo', () => {
    const perguntas = [{ categoria: 'a' }, { categoria: 'b' }];
    expect(categoriasSemRotulo(perguntas, { a: 'A', b: 'B' })).toEqual([]);
  });
});

describe('toda categoria de quiz de toda unidade tem rótulo', () => {
  it('varre as unidades descobertas e não acha categoria órfã', async () => {
    const chaves = Object.keys(CARREGADORES);
    expect(chaves.length, 'nenhuma unidade descoberta').toBeGreaterThan(0);

    const perguntas: PerguntaQuiz[] = [];
    for (const chave of chaves) {
      const conteudo = await CARREGADORES[chave]!();
      perguntas.push(...(conteudo.quiz ?? []));
    }
    expect(perguntas.length, 'nenhuma pergunta lida').toBeGreaterThan(0);

    const orfas = categoriasSemRotulo(perguntas, ROTULOS_CATEGORIA_QUIZ);
    expect(orfas, 'categoria usada sem rótulo em src/conteudo/quiz/categorias.ts').toEqual([]);
  });
});
