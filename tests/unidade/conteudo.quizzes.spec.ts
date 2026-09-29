import { describe, expect, it } from 'vitest';
import { quiz as quizIntr } from '@/conteudo/p1/intr-direito/u1/quiz';
import { quiz as quizRedacao } from '@/conteudo/p1/redacao-juridica-1/u1/quiz';
import { quiz as quizSociologia } from '@/conteudo/p1/sociologia-juridica/u1/quiz';
import { ROTULOS_CATEGORIA_QUIZ } from '@/core/quiz/rotulosCategoria';
import type { PerguntaMultiplaEscolha, PerguntaQuiz } from '@/core/unidade/tipos';

/** Estas três cadeiras só têm múltipla escolha; um verdadeiro ou falso aqui é erro de conteúdo. */
function soMultiplaEscolha(quiz: readonly PerguntaQuiz[]): readonly PerguntaMultiplaEscolha[] {
  return quiz.map((p) => {
    if (p.tipo === 'verdadeiro-ou-falso')
      throw new Error(`id ${p.id}: verdadeiro ou falso inesperado`);
    return p;
  });
}

const TODOS: ReadonlyArray<{
  nome: string;
  quiz: readonly PerguntaMultiplaEscolha[];
  alternativas: 4 | 5;
}> = [
  { nome: 'Introdução ao Direito', quiz: soMultiplaEscolha(quizIntr), alternativas: 4 },
  { nome: 'Redação Jurídica 1', quiz: soMultiplaEscolha(quizRedacao), alternativas: 4 },
  { nome: 'Sociologia Jurídica', quiz: soMultiplaEscolha(quizSociologia), alternativas: 5 }
];

describe.each(TODOS)('quiz de $nome', ({ quiz, alternativas }) => {
  it('ids únicos', () => {
    const ids = quiz.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it(`toda pergunta tem ${alternativas} alternativas e a correta cabe nelas`, () => {
    for (const p of quiz) {
      expect(p.alternativasHtml, `id ${p.id}`).toHaveLength(alternativas);
      expect(p.correta, `id ${p.id}`).toBeGreaterThanOrEqual(0);
      expect(p.correta, `id ${p.id}`).toBeLessThan(p.alternativasHtml.length);
    }
  });

  it('nenhuma alternativa ou explicação vazia, e toda categoria tem rótulo', () => {
    for (const p of quiz) {
      for (const a of p.alternativasHtml) expect(a.trim(), `id ${p.id}`).not.toBe('');
      expect(p.explicacaoHtml.trim(), `id ${p.id}`).not.toBe('');
      expect(ROTULOS_CATEGORIA_QUIZ[p.categoria], `id ${p.id}`).toBeTruthy();
    }
  });

  it('gabaritoDoCaderno, quando existe, é true (nunca false)', () => {
    for (const p of quiz) {
      if ('gabaritoDoCaderno' in p) expect(p.gabaritoDoCaderno, `id ${p.id}`).toBe(true);
    }
  });
});

describe('quiz de Sociologia Jurídica, conjunto', () => {
  it('tem 80 perguntas', () => {
    expect(quizSociologia).toHaveLength(80);
  });

  it('só usa as quatro categorias da unidade', () => {
    const cats = new Set(quizSociologia.map((p) => p.categoria));
    expect([...cats].sort()).toEqual(['aplicacao', 'atividade', 'classicos', 'conceitos']);
  });

  it('as 10 da atividade (ids 1 a 10) levam a marca do caderno e só elas', () => {
    const marcadas = quizSociologia.filter((p) => p.gabaritoDoCaderno === true);
    expect(marcadas).toHaveLength(10);
    expect(marcadas.map((p) => p.id).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    ]);
    expect(marcadas.every((p) => p.categoria === 'atividade')).toBe(true);
  });
});
