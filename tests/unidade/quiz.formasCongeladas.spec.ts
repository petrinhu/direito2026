import { describe, expect, it } from 'vitest';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { FORMAS_CONGELADAS } from '@/app/quiz/formasCongeladas';
import type { FormaPergunta } from '@/core/quiz/tipos';
import type { PerguntaQuiz } from '@/core/unidade/tipos';

/**
 * AV3-K4: a forma congelada tem de ser a forma do conteúdo atual, quiz por quiz. Se
 * ela errar um tipo (V/F) ou uma contagem de alternativas, a tradução das respostas
 * salvas erra em silêncio. Sem esta prova, o primeiro quiz não tocado pelo teste de
 * tradução (ex.: Filosofia u1, que tem V/F) pode divergir sem aviso.
 */
function formaDe(quiz: readonly PerguntaQuiz[]): FormaPergunta[] {
  return quiz.map((pergunta) =>
    pergunta.tipo === 'verdadeiro-ou-falso'
      ? { id: pergunta.id, tipo: 'vf', alternativas: 2 }
      : { id: pergunta.id, tipo: 'mc', alternativas: pergunta.alternativasHtml.length as 4 | 5 }
  );
}

describe('formas congeladas x conteúdo atual (AV3-K4)', () => {
  it('as chaves da forma são exatamente as unidades que têm quiz', async () => {
    const comQuiz: string[] = [];
    for (const chave of Object.keys(CARREGADORES)) {
      const conteudo = await CARREGADORES[chave]!();
      if (conteudo.quiz !== undefined) comQuiz.push(chave);
    }
    expect(comQuiz.sort()).toEqual(Object.keys(FORMAS_CONGELADAS).sort());
  });

  it.each(Object.keys(FORMAS_CONGELADAS))(
    '%s tem a forma do conteúdo atual, pergunta por pergunta',
    async (chave) => {
      const conteudo = await CARREGADORES[chave]!();
      expect(formaDe(conteudo.quiz ?? [])).toEqual(FORMAS_CONGELADAS[chave]);
    }
  );
});
