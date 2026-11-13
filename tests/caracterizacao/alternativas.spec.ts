import { describe, expect, it } from 'vitest';
import {
  compararAlternativas,
  impressaoDaAlternativa,
  type AlternativasPorUnidade
} from './alternativas';

/**
 * Portão das alternativas (AV3-K4). Cada caso é uma lista de impressões de uma pergunta:
 * reprova o que quebra a resposta guardada por posição original, e aceita o que só
 * acrescenta no fim ou edita o texto no lugar.
 */
const [a, b, c, d, x] = ['alfa', 'beta', 'gama', 'delta', 'novo'].map(impressaoDaAlternativa) as [
  string,
  string,
  string,
  string,
  string
];

function unidade(perguntas: Record<string, string[]>): AlternativasPorUnidade {
  return { 'p1/teste/u1': perguntas };
}

const ESPERADO = unidade({ '1': [a, b, c, d] });

describe('portão de alternativas: reprova o que quebra a resposta guardada', () => {
  it('pergunta que sumiu reprova', () => {
    const r = compararAlternativas(ESPERADO, unidade({}));
    expect(r.reprovacoes).toHaveLength(1);
    expect(r.reprovacoes[0]).toMatch(/pergunta 1: pergunta sumiu/);
  });

  it('alternativa que sumiu reprova', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': [a, b, c] }));
    expect(r.reprovacoes.some((m) => m.includes('alternativa sumiu'))).toBe(true);
  });

  it('impressão antiga em outra posição da mesma pergunta (reordenação) reprova', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': [b, a, c, d] }));
    expect(r.reprovacoes.some((m) => m.includes('fora de ordem'))).toBe(true);
  });

  it('alternativa nova que não está no fim reprova', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': [a, x, b, c, d] }));
    expect(r.reprovacoes.length).toBeGreaterThan(0);
  });
});

describe('portão de alternativas: aceita o que só acrescenta ou edita no lugar', () => {
  it('alternativa nova no fim é aceita, sem reprovação', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': [a, b, c, d, x] }));
    expect(r.reprovacoes).toEqual([]);
    expect(r.aceitas.some((m) => m.includes('nova no fim'))).toBe(true);
  });

  it('pergunta nova é aceita', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': [a, b, c, d], '2': [a, b] }));
    expect(r.reprovacoes).toEqual([]);
    expect(r.aceitas.some((m) => m.includes('pergunta 2'))).toBe(true);
  });

  it('texto editado no lugar (impressão nova que não existia na pergunta) é aceito', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': [a, b, x, d] }));
    expect(r.reprovacoes).toEqual([]);
    expect(r.aceitas.some((m) => m.includes('editada no lugar'))).toBe(true);
  });

  it('sem nenhuma mudança, não há reprovação nem aceite', () => {
    expect(compararAlternativas(ESPERADO, ESPERADO)).toEqual({ reprovacoes: [], aceitas: [] });
  });
});
