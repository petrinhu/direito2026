import { describe, expect, it } from 'vitest';
import { quiz } from '../../src/conteudo/p1/filosofia-juridica/u3-moderna-contemporanea/quiz';
import { quizConforme } from '../../scripts/apoio/contagemQuiz';

/**
 * Filosofia u3 (moderna e contemporânea, AV3): quiz de 104 perguntas, 44 de múltipla escolha e
 * 60 de verdadeiro ou falso. As perguntas 89 a 104 são o material de aula da disciplina (origem
 * 'professor', categoria 'revisao'), em ordem, e não são reescritas. O gabarito é fixado aqui.
 */
const GABARITO_PROFESSOR: ReadonlyArray<readonly [number, boolean]> = [
  [89, false],
  [90, true],
  [91, false],
  [92, true],
  [93, false],
  [94, true],
  [95, false],
  [96, false],
  [97, false],
  [98, false],
  [99, false],
  [100, true],
  [101, false],
  [102, false],
  [103, true],
  [104, false]
];

const TRAVESSAO = /[–—]/;
const URL = /https?:\/\/|w{3}\./i;

function textoDaPergunta(p: {
  enunciadoHtml: string;
  alternativasHtml?: readonly string[];
  explicacaoHtml?: string;
}): string {
  return [p.enunciadoHtml, ...(p.alternativasHtml ?? []), p.explicacaoHtml ?? ''].join(' ');
}

describe('Filosofia u3 AV3: quiz de 104 perguntas (44 e 60)', () => {
  it('104 perguntas, ids de 1 a 104 sem buraco, 44 de múltipla escolha e 60 de verdadeiro ou falso', () => {
    expect(quiz).toHaveLength(104);
    expect(quiz.map((p) => p.id)).toEqual(Array.from({ length: 104 }, (_, i) => i + 1));
    expect(quiz.filter((p) => p.tipo === 'verdadeiro-ou-falso')).toHaveLength(60);
    expect(quiz.filter((p) => p.tipo !== 'verdadeiro-ou-falso')).toHaveLength(44);
  });

  it('o portão de contagem do quiz de Filosofia AV3 passa', () => {
    expect(quizConforme(quiz)).toBe(true);
  });
});

describe('Filosofia u3 AV3: perguntas 89 a 104 são do professor (verdadeiro ou falso, origem professor)', () => {
  it.each(GABARITO_PROFESSOR)(
    'pergunta %i: verdadeiro ou falso, categoria revisao, gabarito %s',
    (id, correta) => {
      const p = quiz.find((q) => q.id === id);
      expect(p?.tipo).toBe('verdadeiro-ou-falso');
      expect(p?.origem).toBe('professor');
      expect(p?.categoria).toBe('revisao');
      expect(p?.fonteExtra).toBe(false);
      expect(p?.gabaritoDoCaderno).toBeUndefined();
      expect(p?.correta).toBe(correta);
      expect(String(p?.explicacaoHtml ?? '').trim()).not.toBe('');
    }
  );

  it('texto das perguntas 89 a 104 não tem travessão nem URL', () => {
    for (const p of quiz.filter((q) => q.id >= 89 && q.id <= 104)) {
      const texto = textoDaPergunta(p);
      expect(TRAVESSAO.test(texto), 'travessão na pergunta ' + p.id).toBe(false);
      expect(URL.test(texto), 'URL na pergunta ' + p.id).toBe(false);
    }
  });
});
