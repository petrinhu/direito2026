import { describe, expect, it } from 'vitest';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { quiz as quizSociologia } from '@/conteudo/p1/sociologia-juridica/u1/quiz';
import { quiz as quizFilosofia } from '@/conteudo/p1/filosofia-juridica/u1/quiz';
import { quiz as quizFilosofiaU3 } from '@/conteudo/p1/filosofia-juridica/u3/quiz';
import { ROTULOS_CATEGORIA_QUIZ } from '@/conteudo/quiz/categorias';
import type { PerguntaQuiz, PerguntaVerdadeiroOuFalso } from '@/core/unidade/tipos';

/**
 * Invariantes de conteúdo dos quizzes. Todas valem para QUALQUER número de
 * perguntas e para QUALQUER tipo de unidade: acrescentar pergunta, inclusive de
 * verdadeiro ou falso, não quebra este arquivo.
 *
 * As contagens e faixas exatas (perguntas por tipo, perguntas do professor,
 * ids com marca do caderno e ids por categoria) NÃO ficam aqui: estão
 * congeladas em tests/caracterizacao/ (carregadores.esperado.json) e se
 * atualizam com `npm run atualizar-referencias`. As regras gerais de texto
 * (alternativas, correta, campos vazios, categoria com rótulo, aula/slide,
 * travessão) valem para toda unidade pela varredura (conteudo.varredura.spec.ts).
 */

/** Sequência 1..n. */
function sequencia(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

function idsDe(quiz: readonly PerguntaQuiz[]): number[] {
  return quiz.map((p) => p.id).sort((a, b) => a - b);
}

/** Todo quiz que o carregamento descobre em src/conteudo, sem lista à mão. */
async function quizzesDescobertos(): Promise<{ chave: string; quiz: readonly PerguntaQuiz[] }[]> {
  const achados: { chave: string; quiz: readonly PerguntaQuiz[] }[] = [];
  for (const chave of Object.keys(CARREGADORES)) {
    const conteudo = await CARREGADORES[chave]!();
    if (conteudo.quiz) achados.push({ chave, quiz: conteudo.quiz });
  }
  return achados;
}

describe('todo quiz descoberto em src/conteudo', () => {
  it('há quizzes para varrer (piso: zero seria varredura quebrada, não conteúdo limpo)', async () => {
    expect((await quizzesDescobertos()).length).toBeGreaterThan(0);
  });

  it('ids únicos e contíguos a partir de 1, em cada quiz', async () => {
    for (const { chave, quiz } of await quizzesDescobertos()) {
      expect(idsDe(quiz), chave).toEqual(sequencia(quiz.length));
    }
  });

  it('dentro de cada quiz, toda pergunta de múltipla escolha tem a mesma quantidade de alternativas, 4 ou 5', async () => {
    for (const { chave, quiz } of await quizzesDescobertos()) {
      const tamanhos = new Set(
        quiz.flatMap((p) => ('alternativasHtml' in p ? [p.alternativasHtml.length] : []))
      );
      expect(tamanhos.size, chave).toBeLessThanOrEqual(1);
      for (const tamanho of tamanhos) expect([4, 5], chave).toContain(tamanho);
    }
  });

  it('toda pergunta do professor é verdadeiro ou falso', async () => {
    for (const { chave, quiz } of await quizzesDescobertos()) {
      for (const p of quiz.filter((q) => q.origem === 'professor')) {
        expect(p.tipo, `${chave} id ${p.id}`).toBe('verdadeiro-ou-falso');
      }
    }
  });

  it('verdadeiro ou falso não tem alternativas e a correta é booleana', async () => {
    for (const { chave, quiz } of await quizzesDescobertos()) {
      for (const p of quiz) {
        if (p.tipo !== 'verdadeiro-ou-falso') continue;
        const vf = p as PerguntaVerdadeiroOuFalso;
        expect('alternativasHtml' in vf, `${chave} id ${vf.id}`).toBe(false);
        expect(typeof vf.correta, `${chave} id ${vf.id}`).toBe('boolean');
      }
    }
  });
});

describe('Sociologia Jurídica: marca do caderno', () => {
  it('toda pergunta marcada com o gabarito do caderno é da categoria atividade', () => {
    const marcadas = quizSociologia.filter((p) => p.gabaritoDoCaderno === true);
    expect(marcadas.length).toBeGreaterThan(0);
    expect(marcadas.every((p) => p.categoria === 'atividade')).toBe(true);
  });
});

describe('Filosofia Jurídica, unidade 1: marca do caderno', () => {
  it('nenhuma pergunta leva a marca do caderno (o gabarito é do professor)', () => {
    expect(quizFilosofia.filter((p) => 'gabaritoDoCaderno' in p)).toEqual([]);
  });
});

describe('Filosofia Jurídica, unidade 3: categorias com rótulo', () => {
  it('as categorias usadas nesta unidade têm rótulo, e os ids seguem em ordem', () => {
    expect(idsDe(quizFilosofiaU3)).toEqual(sequencia(quizFilosofiaU3.length));
    for (const p of quizFilosofiaU3) {
      expect(ROTULOS_CATEGORIA_QUIZ[p.categoria], `id ${p.id}`).toBeDefined();
    }
  });

  it('rótulos das duas categorias', () => {
    expect(ROTULOS_CATEGORIA_QUIZ['filosofia-moderna']).toBe('Filosofia Moderna');
    expect(ROTULOS_CATEGORIA_QUIZ['filosofia-social']).toBe('Filosofia Social');
  });
});
