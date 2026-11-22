import { describe, expect, it } from 'vitest';
import { quiz } from '../../src/conteudo/p1/redacao-juridica-1/u3-material-peticao-consumidor/quiz';

/**
 * Redação u3 (petição de consumidor, AV3-R1-B, decisão do CPO de 16/11/2026): quiz de 44 perguntas,
 * 22 de múltipla escolha e 22 de verdadeiro ou falso. As perguntas 1 a 40 mantêm o gabarito
 * publicado: a resposta salva de quem já respondeu continua certa.
 *
 * AV3-R2 (prazos, garantia e arrependimento): as perguntas 45 a 52 entram no fim, e o total passa a
 * 52 perguntas, 26 de múltipla escolha e 26 de verdadeiro ou falso (ids de 1 a 52, sem buraco).
 * QUIZ-80 (21/11/2026): as perguntas 53 a 80 entram no fim, e o total passa a 80, 40 e 40.
 * AV3-R1-B (22/11/2026): as perguntas 81 a 88 (audiência de conciliação, Dos Fatos e os três prazos
 * como a disciplina apresenta) entram no fim, e o total passa a 88, 44 e 44.
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

describe('Redação u3 AV3-R1-B, AV3-R2 e QUIZ-80: quiz de 88 perguntas (44 e 44)', () => {
  it('88 perguntas, ids de 1 a 88 sem buraco, 44 de múltipla escolha e 44 de verdadeiro ou falso', () => {
    expect(quiz).toHaveLength(88);
    expect(quiz.map((p) => p.id)).toEqual(Array.from({ length: 88 }, (_, i) => i + 1));
    expect(quiz.filter((p) => p.tipo === 'verdadeiro-ou-falso')).toHaveLength(44);
    expect(quiz.filter((p) => p.tipo !== 'verdadeiro-ou-falso')).toHaveLength(44);
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
    expect(quiz.slice(40, 44)).toHaveLength(4);
    for (const p of quiz.slice(40, 44)) {
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

/**
 * Tabela da seção 3 do plano AV3-R2, fixada antes do texto (L-43). Cada linha: id, forma ('me' ou
 * 'vf'), gabarito do verdadeiro ou falso (null na múltipla escolha) e categoria.
 */
const TABELA_45_A_52: ReadonlyArray<readonly [number, 'me' | 'vf', boolean | null, string]> = [
  [45, 'me', null, 'consumo-prazos-garantias'],
  [46, 'vf', true, 'consumo-prazos-garantias'],
  [47, 'me', null, 'consumo-responsabilidade'],
  [48, 'vf', false, 'consumo-responsabilidade'],
  [49, 'me', null, 'consumo-prazos-garantias'],
  [50, 'vf', false, 'consumo-prazos-garantias'],
  [51, 'me', null, 'consumo-prazos-garantias'],
  [52, 'vf', true, 'consumo-prazos-garantias']
];

describe('Redação u3 AV3-R2: perguntas 45 a 52 (prazos, garantia e arrependimento)', () => {
  it.each(TABELA_45_A_52)(
    'pergunta %i: forma, gabarito, categoria e fonteExtra conforme a tabela do plano',
    (id, forma, gabaritoVf, categoria) => {
      const p = quiz.find((q) => q.id === id);
      expect(p, 'pergunta ' + id).toBeDefined();
      expect(p?.categoria, 'categoria da pergunta ' + id).toBe(categoria);
      expect(p?.fonteExtra, 'fonteExtra da pergunta ' + id).toBe(false);
      if (forma === 'vf') {
        expect(p?.tipo, 'tipo da pergunta ' + id).toBe('verdadeiro-ou-falso');
        expect(p?.correta, 'gabarito da pergunta ' + id).toBe(gabaritoVf);
      } else {
        expect(p?.tipo, 'tipo da pergunta ' + id).not.toBe('verdadeiro-ou-falso');
        const multipla = p?.tipo !== 'verdadeiro-ou-falso' ? p : undefined;
        expect(multipla?.alternativasHtml, 'alternativas da pergunta ' + id).toHaveLength(5);
        expect(p?.correta, 'correta da pergunta ' + id).toBeGreaterThanOrEqual(0);
        expect(p?.correta, 'correta da pergunta ' + id).toBeLessThan(5);
      }
    }
  );
});

type LinhaDaTabela = readonly [number, 'me' | 'vf', number | boolean, string, boolean];

/**
 * AV3-R1-B (22/11/2026, decisões do líder): tabela do aceite das perguntas 81 a 88, fixada antes de
 * rodar os testes (L-43). Cada linha: id, forma ('me' ou 'vf'), gabarito (índice da correta na
 * múltipla escolha, booleano no verdadeiro ou falso), categoria e fonteExtra (true só nas que usam a
 * Lei 9.099/1995, que não tem id nos dispositivos).
 */
const TABELA_81_A_88: ReadonlyArray<LinhaDaTabela> = [
  [81, 'me', 3, 'peticao', true],
  [82, 'vf', true, 'peticao', true],
  [83, 'me', 2, 'peticao', false],
  [84, 'vf', false, 'peticao', false],
  [85, 'me', 3, 'consumo-prazos-garantias', false],
  [86, 'vf', true, 'consumo-prazos-garantias', false],
  [87, 'me', 4, 'consumo-prazos-garantias', false],
  [88, 'vf', false, 'consumo-prazos-garantias', false]
];

describe('Redação u3 AV3-R1-B: perguntas 81 a 88 (audiência, Dos Fatos e os três prazos)', () => {
  it.each(TABELA_81_A_88)(
    'pergunta %i: forma, gabarito, categoria e fonteExtra conforme a tabela',
    (id, forma, gabarito, categoria, fonteExtra) => {
      const p = quiz.find((q) => q.id === id);
      expect(p, 'pergunta ' + id).toBeDefined();
      expect(p?.categoria, 'categoria da pergunta ' + id).toBe(categoria);
      expect(p?.fonteExtra, 'fonteExtra da pergunta ' + id).toBe(fonteExtra);
      expect(p?.correta, 'gabarito da pergunta ' + id).toBe(gabarito);
      if (forma === 'vf') {
        expect(p?.tipo, 'tipo da pergunta ' + id).toBe('verdadeiro-ou-falso');
      } else {
        expect(p?.tipo, 'tipo da pergunta ' + id).not.toBe('verdadeiro-ou-falso');
        const multipla = p?.tipo !== 'verdadeiro-ou-falso' ? p : undefined;
        expect(multipla?.alternativasHtml, 'alternativas da pergunta ' + id).toHaveLength(5);
      }
    }
  );
});
