import { describe, expect, it } from 'vitest';
import { embaralharRodada, ordemDaRodada } from '@/core/quiz/motor';
import type { FormaPergunta } from '@/core/quiz/tipos';
import type { PerguntaQuiz } from '@/core/unidade/tipos';
import { FORMAS_CONGELADAS } from '@/app/quiz/formasCongeladas';
import { quiz as quizFilosofia } from '@/conteudo/p1/filosofia-juridica/u3-moderna-contemporanea/quiz/index';

/**
 * AV3-K4: a forma congelada tem de sair na MESMA ordem que o motor sorteia com o
 * conteúdo. Se as duas divergirem, a tradução das respostas salvas erra em silêncio.
 */
function formaDe(perguntas: readonly PerguntaQuiz[]): FormaPergunta[] {
  return perguntas.map((p) =>
    p.tipo === 'verdadeiro-ou-falso'
      ? { id: p.id, tipo: 'vf', alternativas: 2 }
      : { id: p.id, tipo: 'mc', alternativas: p.alternativasHtml.length as 4 | 5 }
  );
}

const SINTETICO: PerguntaQuiz[] = [
  {
    id: 1,
    categoria: 'teoria',
    enunciadoHtml: 'a',
    explicacaoHtml: 'x',
    fonteExtra: false,
    alternativasHtml: ['a', 'b', 'c', 'd'],
    correta: 0
  },
  {
    id: 2,
    categoria: 'teoria',
    enunciadoHtml: 'b',
    explicacaoHtml: 'x',
    fonteExtra: false,
    tipo: 'verdadeiro-ou-falso',
    correta: true
  } as PerguntaQuiz,
  {
    id: 3,
    categoria: 'teoria',
    enunciadoHtml: 'c',
    explicacaoHtml: 'x',
    fonteExtra: false,
    alternativasHtml: ['1', '2', '3', '4', '5'],
    correta: 4
  },
  {
    id: 4,
    categoria: 'teoria',
    enunciadoHtml: 'd',
    explicacaoHtml: 'x',
    fonteExtra: false,
    alternativasHtml: ['w', 'x', 'y', 'z'],
    correta: 2
  },
  {
    id: 5,
    categoria: 'teoria',
    enunciadoHtml: 'e',
    explicacaoHtml: 'x',
    fonteExtra: false,
    tipo: 'verdadeiro-ou-falso',
    correta: false
  } as PerguntaQuiz
];

describe('ordemDaRodada', () => {
  it('é a forma do sorteio: mesma ordem de perguntas e de alternativas que embaralharRodada, para várias sementes', () => {
    for (const semente of [1, 42, 7, 2026, 987654]) {
      const rodada = embaralharRodada(SINTETICO, semente);
      const ordem = ordemDaRodada(formaDe(SINTETICO), semente);
      expect(ordem.ids).toEqual(rodada.perguntas.map((p) => p.id));
      for (const pergunta of rodada.perguntas) {
        expect(ordem.alternativas.get(pergunta.id)).toEqual(pergunta.ordemOriginal);
      }
    }
  });

  it('a forma congelada de Filosofia u3 reproduz a rodada de hoje, com o conteúdo real', () => {
    const forma = FORMAS_CONGELADAS['p1/filosofia-juridica/u3-moderna-contemporanea'];
    expect(forma).toBeDefined();
    const rodada = embaralharRodada(quizFilosofia, 2026);
    const ordem = ordemDaRodada(forma!, 2026);
    expect(ordem.ids).toEqual(rodada.perguntas.map((p) => p.id));
    for (const pergunta of rodada.perguntas) {
      expect(ordem.alternativas.get(pergunta.id)).toEqual(pergunta.ordemOriginal);
    }
  });
});
