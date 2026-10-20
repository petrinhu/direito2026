import { describe, expect, it } from 'vitest';
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
 * Invariantes de conteúdo dos quizzes que NÃO são regra geral. As regras
 * gerais (ids únicos, alternativas, correta, campos vazios, categoria com
 * rótulo, letra/posição, aula/slide, "o material", gabarito só true) valem
 * para TODA unidade pela varredura (conteudo.varredura.spec.ts) e por
 * validarUnidade. As contagens de perguntas e de categorias por unidade estão
 * congeladas em tests/caracterizacao/carregadores.esperado.json.
 */

/** Sequência 1..n, sem repetir o número de perguntas no código. */
function sequencia(quiz: readonly PerguntaQuiz[]): number[] {
  return Array.from({ length: quiz.length }, (_, i) => i + 1);
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

describe.each([
  ['Introdução ao Direito', quizIntr, 4],
  ['Redação Jurídica 1', quizRedacao, 4],
  ['Sociologia Jurídica', quizSociologia, 5],
  ['Filosofia Jurídica, unidade 3', quizFilosofiaU3, 4]
] as const)('%s: só múltipla escolha, com %i alternativas', (_nome, quiz, alternativas) => {
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
  it('só as perguntas da atividade levam a marca, e são as de número 1 a 10', () => {
    const marcadas = quizSociologia.filter((p) => p.gabaritoDoCaderno === true);
    expect(idsDe(marcadas)).toEqual(sequencia(marcadas));
    expect(marcadas.every((p) => p.categoria === 'atividade')).toBe(true);
    expect(idsDe(marcadas)[0]).toBe(1);
    expect(idsDe(marcadas).at(-1)).toBe(10);
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
    expect(idsDe(quizFilosofia)).toEqual(sequencia(quizFilosofia));
  });

  it('metade de múltipla escolha, cinco alternativas cada, e metade de verdadeiro ou falso', () => {
    expect(multipla).toHaveLength(40);
    expect(verdadeiroOuFalso).toHaveLength(40);
    for (const p of multipla) {
      expect(p.alternativasHtml, `id ${p.id}`).toHaveLength(5);
    }
  });

  it('verdadeiro ou falso não tem alternativas e a correta é booleana', () => {
    for (const p of verdadeiroOuFalso) {
      expect('alternativasHtml' in p, `id ${p.id}`).toBe(false);
      expect(typeof p.correta, `id ${p.id}`).toBe('boolean');
    }
  });

  it('as 20 do professor são os ids 1 a 20, todas verdadeiro ou falso, e só elas', () => {
    const doProfessor = quizFilosofia.filter((p) => p.origem === 'professor');
    expect(idsDe(doProfessor)).toEqual(sequencia(doProfessor));
    expect(doProfessor).toHaveLength(20);
    expect(doProfessor.every((p) => p.tipo === 'verdadeiro-ou-falso')).toBe(true);
  });

  it('nenhuma pergunta leva a marca do caderno (o gabarito é do professor)', () => {
    expect(quizFilosofia.filter((p) => 'gabaritoDoCaderno' in p)).toEqual([]);
  });
});

describe('Filosofia Jurídica, unidade 3: faixas por categoria', () => {
  it('ids 1 a 16 são Filosofia Moderna e 17 a 20 são Filosofia Social', () => {
    const moderna = quizFilosofiaU3.filter((p) => p.id <= 16);
    const social = quizFilosofiaU3.filter((p) => p.id >= 17);
    expect(moderna.every((p) => p.categoria === 'filosofia-moderna')).toBe(true);
    expect(social.every((p) => p.categoria === 'filosofia-social')).toBe(true);
    expect(idsDe(quizFilosofiaU3)).toEqual(sequencia(quizFilosofiaU3));
  });

  it('rótulos das duas categorias', () => {
    expect(ROTULOS_CATEGORIA_QUIZ['filosofia-moderna']).toBe('Filosofia Moderna');
    expect(ROTULOS_CATEGORIA_QUIZ['filosofia-social']).toBe('Filosofia Social');
  });
});
