import { describe, expect, it } from 'vitest';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { quiz as quizIntr } from '@/conteudo/p1/intr-direito/u1/quiz';
import { quiz as quizRedacao } from '@/conteudo/p1/redacao-juridica-1/u1/quiz';
import { quiz as quizSociologia } from '@/conteudo/p1/sociologia-juridica/u1/quiz';
import { quiz as quizFilosofia } from '@/conteudo/p1/filosofia-juridica/u1/quiz';
import { quiz as quizFilosofiaU3 } from '@/conteudo/p1/filosofia-juridica/u3/quiz';
import { ROTULOS_CATEGORIA_QUIZ } from '@/conteudo/quiz/categorias';
import type {
  PerguntaMultiplaEscolha,
  PerguntaQuiz,
  PerguntaVerdadeiroOuFalso
} from '@/core/unidade/tipos';

/**
 * Invariantes de conteúdo dos quizzes. Todas valem para QUALQUER número de
 * perguntas: acrescentar pergunta não quebra este arquivo.
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

function soMultiplaEscolha(quiz: readonly PerguntaQuiz[]): readonly PerguntaMultiplaEscolha[] {
  return quiz.map((p) => {
    if (p.tipo === 'verdadeiro-ou-falso')
      throw new Error(`id ${p.id}: verdadeiro ou falso inesperado`);
    return p;
  });
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

describe.each([
  ['Introdução ao Direito', quizIntr, 4],
  ['Redação Jurídica 1', quizRedacao, 4],
  ['Sociologia Jurídica', quizSociologia, 5],
  ['Filosofia Jurídica, unidade 3', quizFilosofiaU3, 4]
] as const)('%s: só múltipla escolha', (_nome, quiz, alternativas) => {
  it('não tem verdadeiro ou falso', () => {
    expect(() => soMultiplaEscolha(quiz)).not.toThrow();
  });

  it(`toda pergunta tem ${alternativas} alternativas`, () => {
    for (const p of soMultiplaEscolha(quiz)) {
      expect(p.alternativasHtml, `id ${p.id}`).toHaveLength(alternativas);
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

describe('Filosofia Jurídica, unidade 1: formato', () => {
  const multipla = quizFilosofia.filter(
    (p): p is PerguntaMultiplaEscolha => p.tipo !== 'verdadeiro-ou-falso'
  );
  const verdadeiroOuFalso = quizFilosofia.filter(
    (p): p is PerguntaVerdadeiroOuFalso => p.tipo === 'verdadeiro-ou-falso'
  );

  it('ids contíguos de 1 ao total de perguntas', () => {
    expect(idsDe(quizFilosofia)).toEqual(sequencia(quizFilosofia.length));
  });

  it('a múltipla escolha tem cinco alternativas cada, e tem verdadeiro ou falso junto', () => {
    expect(multipla.length).toBeGreaterThan(0);
    expect(verdadeiroOuFalso.length).toBeGreaterThan(0);
    for (const p of multipla) {
      expect(p.alternativasHtml, `id ${p.id}`).toHaveLength(5);
    }
  });

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
