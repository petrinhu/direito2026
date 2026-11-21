import { describe, expect, it } from 'vitest';
import { quiz } from '../../src/conteudo/p1/filosofia-juridica/u3-decisao-perspectiva-racial/quiz';
import { quizConforme } from '../../scripts/apoio/contagemQuiz';

/**
 * Filosofia u3 (perspectiva racial, AV3, decisão do CPO de 16/11/2026): quiz de 92 perguntas,
 * 44 de múltipla escolha e 48 de verdadeiro ou falso (44 do conteúdo da AV3 e 4 do professor, ids 89 a 92). O gabarito das perguntas 1 a 80 é o que
 * estava publicado: a resposta salva de quem já respondeu continua certa (o teste fixa os valores).
 */
const GABARITO_PUBLICADO: ReadonlyArray<readonly [number, number | boolean]> = [
  [1, 2],
  [2, false],
  [3, 0],
  [4, false],
  [5, 3],
  [6, true],
  [7, 1],
  [8, false],
  [9, 4],
  [10, true],
  [11, 2],
  [12, true],
  [13, 0],
  [14, false],
  [15, 3],
  [16, true],
  [17, 1],
  [18, false],
  [19, 4],
  [20, true],
  [21, 1],
  [22, true],
  [23, 4],
  [24, false],
  [25, 0],
  [26, true],
  [27, 2],
  [28, false],
  [29, 3],
  [30, false],
  [31, 1],
  [32, false],
  [33, 4],
  [34, true],
  [35, 0],
  [36, false],
  [37, 2],
  [38, true],
  [39, 3],
  [40, true],
  [41, 1],
  [42, true],
  [43, 4],
  [44, false],
  [45, 0],
  [46, true],
  [47, 2],
  [48, false],
  [49, 3],
  [50, true],
  [51, 1],
  [52, false],
  [53, 4],
  [54, true],
  [55, 0],
  [56, false],
  [57, 2],
  [58, true],
  [59, 3],
  [60, false],
  [61, 1],
  [62, true],
  [63, 4],
  [64, false],
  [65, 0],
  [66, true],
  [67, 2],
  [68, false],
  [69, 3],
  [70, true],
  [71, 1],
  [72, false],
  [73, 4],
  [74, true],
  [75, 0],
  [76, false],
  [77, 2],
  [78, true],
  [79, 3],
  [80, false]
];

const TRAVESSAO = /[\u2013\u2014]/;
const URL = /https?:\/\/|w{3}\./i;

function textoDaPergunta(p: {
  enunciadoHtml: string;
  alternativasHtml?: readonly string[];
  explicacaoHtml?: string;
}): string {
  return [p.enunciadoHtml, ...(p.alternativasHtml ?? []), p.explicacaoHtml ?? ''].join(' ');
}

describe('Filosofia u3 AV3: quiz de 92 perguntas (44 e 48)', () => {
  it('92 perguntas, ids de 1 a 92 sem buraco, 44 de múltipla escolha e 48 de verdadeiro ou falso', () => {
    expect(quiz).toHaveLength(92);
    expect(quiz.map((p) => p.id)).toEqual(Array.from({ length: 92 }, (_, i) => i + 1));
    expect(quiz.filter((p) => p.tipo === 'verdadeiro-ou-falso')).toHaveLength(48);
    expect(quiz.filter((p) => p.tipo !== 'verdadeiro-ou-falso')).toHaveLength(44);
  });

  it('múltipla escolha tem cinco alternativas e correta dentro da faixa; o portão de contagem passa', () => {
    for (const p of quiz.filter((q) => q.tipo !== 'verdadeiro-ou-falso')) {
      expect(p.alternativasHtml, 'alternativas da pergunta ' + p.id).toHaveLength(5);
      expect(p.correta, 'correta da pergunta ' + p.id).toBeGreaterThanOrEqual(0);
      expect(p.correta, 'correta da pergunta ' + p.id).toBeLessThan(5);
    }
    expect(quizConforme(quiz)).toBe(true);
  });

  it('gabarito das perguntas 1 a 80 não muda: a resposta salva de quem já respondeu continua certa', () => {
    for (const [id, correta] of GABARITO_PUBLICADO) {
      const p = quiz.find((q) => q.id === id);
      expect(p?.correta, 'gabarito da pergunta ' + id).toBe(correta);
    }
  });

  it('perguntas 81 a 88 são da categoria perspectiva-racial; fonteExtra só em 82 e 88', () => {
    expect(quiz.slice(80, 88)).toHaveLength(8);
    for (const p of quiz.slice(80, 88)) {
      expect(p.categoria, 'categoria da pergunta ' + p.id).toBe('perspectiva-racial');
      expect(p.fonteExtra, 'fonteExtra da pergunta ' + p.id).toBe(p.id === 82 || p.id === 88);
    }
  });

  it('texto ao aluno das perguntas novas não tem travessão, URL nem o nome da instituição', () => {
    for (const p of quiz.slice(80, 88)) {
      const texto = textoDaPergunta(p);
      expect(TRAVESSAO.test(texto), 'travessão na pergunta ' + p.id).toBe(false);
      expect(URL.test(texto), 'URL na pergunta ' + p.id).toBe(false);
      expect(texto.includes('J\u00fari'), 'menção a área restrita na pergunta ' + p.id).toBe(false);
    }
  });
});

const GABARITO_PROFESSOR_UD: ReadonlyArray<readonly [number, boolean]> = [
  [89, false],
  [90, true],
  [91, false],
  [92, false]
];

describe('Filosofia u3 AV3: perguntas 89 a 92 são do professor (verdadeiro ou falso, origem professor)', () => {
  it.each(GABARITO_PROFESSOR_UD)(
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

  it('texto das perguntas 89 a 92 não tem travessão nem URL', () => {
    for (const p of quiz.filter((q) => q.id >= 89 && q.id <= 92)) {
      const texto = textoDaPergunta(p);
      expect(TRAVESSAO.test(texto), 'travessão na pergunta ' + p.id).toBe(false);
      expect(URL.test(texto), 'URL na pergunta ' + p.id).toBe(false);
    }
  });
});
