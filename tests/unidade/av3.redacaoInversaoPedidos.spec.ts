import { describe, expect, it } from 'vitest';
import { quiz } from '../../src/conteudo/p1/redacao-juridica-1/u3-material-peticao-consumidor/quiz';

/**
 * Redação u3 (petição de consumidor, AV3-R1-B, decisão do CPO de 16/11/2026): quiz de 44 perguntas,
 * 22 de múltipla escolha e 22 de verdadeiro ou falso. As perguntas 1 a 40 mantêm o gabarito
 * publicado: a resposta salva de quem já respondeu continua certa.
 */
const GABARITO_PUBLICADO: ReadonlyArray<readonly [number, number | boolean]> = [
  [1, 2],
  [2, true],
  [3, 0],
  [4, true],
  [5, 3],
  [6, false],
  [7, 1],
  [8, false],
  [9, 2],
  [10, 1],
  [11, true],
  [12, true],
  [13, 3],
  [14, 4],
  [15, false],
  [16, false],
  [17, 0],
  [18, 2],
  [19, true],
  [20, false],
  [21, 4],
  [22, false],
  [23, true],
  [24, 1],
  [25, 2],
  [26, true],
  [27, 4],
  [28, false],
  [29, 3],
  [30, true],
  [31, 1],
  [32, true],
  [33, 0],
  [34, false],
  [35, 2],
  [36, true],
  [37, 3],
  [38, false],
  [39, 1],
  [40, false]
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

describe('Redação u3 AV3-R1-B: quiz de 44 perguntas (22 e 22)', () => {
  it('44 perguntas, ids de 1 a 44 sem buraco, 22 de múltipla escolha e 22 de verdadeiro ou falso', () => {
    expect(quiz).toHaveLength(44);
    expect(quiz.map((p) => p.id)).toEqual(Array.from({ length: 44 }, (_, i) => i + 1));
    expect(quiz.filter((p) => p.tipo === 'verdadeiro-ou-falso')).toHaveLength(22);
    expect(quiz.filter((p) => p.tipo !== 'verdadeiro-ou-falso')).toHaveLength(22);
  });

  it('múltipla escolha tem cinco alternativas e correta dentro da faixa', () => {
    for (const p of quiz.filter((q) => q.tipo !== 'verdadeiro-ou-falso')) {
      expect(p.alternativasHtml, 'alternativas da pergunta ' + p.id).toHaveLength(5);
      expect(p.correta, 'correta da pergunta ' + p.id).toBeGreaterThanOrEqual(0);
      expect(p.correta, 'correta da pergunta ' + p.id).toBeLessThan(5);
    }
  });

  it('gabarito das perguntas 1 a 40 não muda: a resposta salva de quem já respondeu continua certa', () => {
    for (const [id, correta] of GABARITO_PUBLICADO) {
      const p = quiz.find((q) => q.id === id);
      expect(p?.correta, 'gabarito da pergunta ' + id).toBe(correta);
    }
  });

  it('perguntas 41 a 44 são das categorias de direitos básicos e fato, fundamento e pedido; fonteExtra só em 44', () => {
    const esperadas: Record<number, string> = {
      41: 'consumo-direitos-basicos',
      42: 'consumo-direitos-basicos',
      43: 'fato-fundamento-pedido',
      44: 'fato-fundamento-pedido'
    };
    expect(quiz.slice(40)).toHaveLength(4);
    for (const p of quiz.slice(40)) {
      expect(p.categoria, 'categoria da pergunta ' + p.id).toBe(esperadas[p.id]);
      expect(p.fonteExtra, 'fonteExtra da pergunta ' + p.id).toBe(p.id === 44);
    }
  });

  it('texto ao aluno das perguntas novas não tem travessão, URL nem o nome da instituição', () => {
    for (const p of quiz.slice(40)) {
      const texto = textoDaPergunta(p);
      expect(TRAVESSAO.test(texto), 'travessão na pergunta ' + p.id).toBe(false);
      expect(URL.test(texto), 'URL na pergunta ' + p.id).toBe(false);
      expect(texto.includes('J\u00fari'), 'menção a área restrita na pergunta ' + p.id).toBe(false);
    }
  });
});
