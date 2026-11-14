import { describe, expect, it } from 'vitest';
import { embaralharRodada } from '@/core/quiz/motor';
import { indiceOriginalDaEscolha, respostasParaExibir } from '@/app/quiz/respostasPersistidas';
import type { IndiceAlternativa, PerguntaMultiplaEscolha } from '@/core/unidade/tipos';
import { quiz as quizFilosofia } from '@/conteudo/p1/filosofia-juridica/u3-moderna-contemporanea/quiz/index';

const SEMENTE = 2026;

describe('respostasParaExibir: resposta pela posição original vira a posição desta rodada', () => {
  it('cada resposta guardada aponta, na tela, para o mesmo texto que a pergunta original tinha naquela posição', () => {
    const rodada = embaralharRodada(quizFilosofia, SEMENTE);
    const originais: Record<number, IndiceAlternativa> = { 1: 0, 2: 3, 20: 1 };
    const exibidas = respostasParaExibir(rodada.perguntas, originais);
    for (const [idStr, original] of Object.entries(originais)) {
      const id = Number(idStr);
      const perguntaOriginal = quizFilosofia.find((p) => p.id === id)! as PerguntaMultiplaEscolha;
      const perguntaNaTela = rodada.perguntas.find((p) => p.id === id)!;
      const indiceNaTela = exibidas[id]!;
      expect(perguntaNaTela.alternativasHtml[indiceNaTela]).toBe(
        perguntaOriginal.alternativasHtml[original]
      );
    }
  });

  it('ignora posição original que a pergunta não tem', () => {
    // Fixture própria, com quatro alternativas: o conteúdo vivo da Filosofia ganhou a quinta
    // (AV3-F1), e a posição 4 deixou de faltar nele.
    const dePoucasAlternativas: PerguntaMultiplaEscolha[] = [
      {
        id: 1,
        categoria: 'teoria',
        enunciadoHtml: 'a',
        explicacaoHtml: 'x',
        fonteExtra: false,
        alternativasHtml: ['a', 'b', 'c', 'd'],
        correta: 0
      }
    ];
    const rodada = embaralharRodada(dePoucasAlternativas, SEMENTE);
    expect(respostasParaExibir(rodada.perguntas, { 1: 4 as IndiceAlternativa })).toEqual({});
  });
});

describe('indiceOriginalDaEscolha: escolha na tela volta à posição original', () => {
  it('é o inverso de respostasParaExibir, para todas as alternativas de todas as perguntas', () => {
    const rodada = embaralharRodada(quizFilosofia, SEMENTE);
    for (const pergunta of rodada.perguntas) {
      for (let mostrada = 0; mostrada < pergunta.alternativasHtml.length; mostrada++) {
        const indice = mostrada as IndiceAlternativa;
        const original = indiceOriginalDaEscolha(rodada.perguntas, pergunta.id, indice);
        expect(original).toBe(pergunta.ordemOriginal[indice]);
        const devolta = respostasParaExibir(rodada.perguntas, { [pergunta.id]: original! });
        expect(devolta[pergunta.id]).toBe(indice);
      }
    }
  });

  it('pergunta que não existe na rodada devolve undefined', () => {
    const rodada = embaralharRodada(quizFilosofia, SEMENTE);
    expect(indiceOriginalDaEscolha(rodada.perguntas, 9999, 0)).toBeUndefined();
  });
});
