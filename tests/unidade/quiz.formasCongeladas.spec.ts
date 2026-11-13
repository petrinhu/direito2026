import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { FORMAS_CONGELADAS } from '@/app/quiz/formasCongeladas';
import { conferirFormasCongeladas } from '@/app/quiz/conferirFormasCongeladas';
import type { FormaPergunta } from '@/core/quiz/tipos';
import type { PerguntaQuiz } from '@/core/unidade/tipos';

/**
 * AV3-K4b. A forma congelada é a forma LEGADA (v1.9.0.0) e NÃO acompanha o conteúdo: ela só
 * serve para traduzir registro legado. O conteúdo pode crescer por acréscimo (pergunta nova,
 * alternativa nova no fim, unidade nova); quem segura reordenação ou troca de gabarito é o
 * alternativas.esperado.json. Unidade nova nasce no formato novo, sem registro legado.
 */

/** sha256 de JSON.stringify(FORMAS_CONGELADAS) no blob de main (src/app/quiz/formasCongeladas.ts, 69c4298). */
const HASH_FIXADO = '73887072281f7d6474b4892346a4b53c6028825eb2d9d49fc7b36a5b306830a7';

function formaDe(quiz: readonly PerguntaQuiz[]): FormaPergunta[] {
  return quiz.map((pergunta) =>
    pergunta.tipo === 'verdadeiro-ou-falso'
      ? { id: pergunta.id, tipo: 'vf', alternativas: 2 }
      : { id: pergunta.id, tipo: 'mc', alternativas: pergunta.alternativasHtml.length as 4 | 5 }
  );
}

function hashDe(formas: unknown): string {
  return createHash('sha256').update(JSON.stringify(formas)).digest('hex');
}

describe('formas congeladas x conteúdo atual (AV3-K4b)', () => {
  it('o conteúdo atual não viola a forma congelada: zero violações', async () => {
    const atuais: Record<string, FormaPergunta[]> = {};
    for (const chave of Object.keys(CARREGADORES)) {
      const conteudo = await CARREGADORES[chave]!();
      if (conteudo.quiz !== undefined) atuais[chave] = formaDe(conteudo.quiz);
    }
    expect(conferirFormasCongeladas(FORMAS_CONGELADAS, atuais).violacoes).toEqual([]);
  });
});

describe('formas congeladas: imutáveis (AV3-K4b)', () => {
  it('a forma é exatamente a fixada no blob de main', () => {
    expect(hashDe(FORMAS_CONGELADAS)).toBe(HASH_FIXADO);
  });

  it('a trava morde: uma alternativa a mais numa entrada muda o hash', () => {
    const copia = JSON.parse(JSON.stringify(FORMAS_CONGELADAS)) as Record<string, FormaPergunta[]>;
    const primeira = copia['p1/filosofia-juridica/u3-moderna-contemporanea']![0]!;
    expect(primeira.tipo).toBe('mc');
    copia['p1/filosofia-juridica/u3-moderna-contemporanea']![0] = {
      ...primeira,
      alternativas: 5
    } as FormaPergunta;
    expect(hashDe(copia)).not.toBe(HASH_FIXADO);
  });
});
