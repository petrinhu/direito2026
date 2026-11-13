import { describe, expect, it } from 'vitest';
import {
  compararAlternativas,
  impressaoDaAlternativa,
  type AlternativasPorUnidade,
  type ImpressoesDaPergunta
} from './alternativas';

/**
 * Portão das alternativas (AV3-K4), decisão do líder de 13/11/2026 ("Aceitar e avisar").
 * Reprova o que quebra a resposta guardada por posição original (reordenar, remover,
 * alternativa fora do fim) e o que troca qual alternativa é a correta. Aceita e AVISA a
 * edição de texto no lugar, listando-a para quem publica conferir.
 */
const [a, b, c, d, x] = ['alfa', 'beta', 'gama', 'delta', 'novo'].map(impressaoDaAlternativa) as [
  string,
  string,
  string,
  string,
  string
];

function pergunta(alternativas: string[], correta = 0): ImpressoesDaPergunta {
  return { alternativas, correta };
}

function unidade(perguntas: Record<string, ImpressoesDaPergunta>): AlternativasPorUnidade {
  return { 'p1/teste/u1': perguntas };
}

const ESPERADO = unidade({ '1': pergunta([a, b, c, d], 0) });

describe('portão de alternativas: reprova o que quebra a resposta guardada', () => {
  it('pergunta que sumiu reprova', () => {
    const r = compararAlternativas(ESPERADO, unidade({}));
    expect(r.reprovacoes).toHaveLength(1);
    expect(r.reprovacoes[0]).toMatch(/pergunta 1: pergunta sumiu/);
  });

  it('alternativa que sumiu reprova', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': pergunta([a, b, c]) }));
    expect(r.reprovacoes.some((m) => m.includes('alternativa sumiu'))).toBe(true);
  });

  it('impressão antiga em outra posição da mesma pergunta (reordenação) reprova', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': pergunta([b, a, c, d]) }));
    expect(r.reprovacoes.some((m) => m.includes('fora de ordem'))).toBe(true);
  });

  it('alternativa nova que não está no fim reprova', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': pergunta([a, x, b, c, d]) }));
    expect(r.reprovacoes.length).toBeGreaterThan(0);
  });

  it('troca de gabarito reprova, mesmo sem mudar nenhum texto', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': pergunta([a, b, c, d], 2) }));
    expect(r.reprovacoes.some((m) => m.includes('gabarito trocado'))).toBe(true);
  });

  it('troca de gabarito junto com edição de texto continua reprovando', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': pergunta([a, b, x, d], 2) }));
    expect(r.reprovacoes.some((m) => m.includes('gabarito trocado'))).toBe(true);
  });
});

describe('portão de alternativas: aceita e avisa a edição no lugar', () => {
  it('texto editado no lugar não reprova e vai para os avisos', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': pergunta([a, b, x, d], 0) }));
    expect(r.reprovacoes).toEqual([]);
    expect(r.avisos.some((m) => m.includes('editada no lugar'))).toBe(true);
    expect(r.aceitas.some((m) => m.includes('editada no lugar'))).toBe(false);
  });

  it('editar a alternativa correta aparece no aviso como alternativa correta', () => {
    const esperadoCorreta2 = unidade({ '1': pergunta([a, b, c, d], 2) });
    const r = compararAlternativas(esperadoCorreta2, unidade({ '1': pergunta([a, b, x, d], 2) }));
    expect(r.reprovacoes).toEqual([]);
    expect(r.avisos.some((m) => m.includes('alternativa correta'))).toBe(true);
  });

  it('alternativa nova no fim é aceita, sem aviso e sem reprovação', () => {
    const r = compararAlternativas(ESPERADO, unidade({ '1': pergunta([a, b, c, d, x], 0) }));
    expect(r.reprovacoes).toEqual([]);
    expect(r.avisos).toEqual([]);
    expect(r.aceitas.some((m) => m.includes('nova no fim'))).toBe(true);
  });

  it('pergunta nova é aceita', () => {
    const r = compararAlternativas(
      ESPERADO,
      unidade({ '1': pergunta([a, b, c, d], 0), '2': pergunta([a, b], 0) })
    );
    expect(r.reprovacoes).toEqual([]);
    expect(r.aceitas.some((m) => m.includes('pergunta 2'))).toBe(true);
  });

  it('sem nenhuma mudança, não há reprovação, aviso nem aceite', () => {
    expect(compararAlternativas(ESPERADO, ESPERADO)).toEqual({
      reprovacoes: [],
      avisos: [],
      aceitas: []
    });
  });
});
