import { describe, expect, it } from 'vitest';
import { quiz as quizIntr } from '@/conteudo/p1/intr-direito/u1/quiz';
import { quiz as quizRedacao } from '@/conteudo/p1/redacao-juridica-1/u1/quiz';
import { quiz as quizSociologia } from '@/conteudo/p1/sociologia-juridica/u1/quiz';
import { quiz as quizFilosofia } from '@/conteudo/p1/filosofia-juridica/u1/quiz';
import { ROTULOS_CATEGORIA_QUIZ } from '@/core/quiz/rotulosCategoria';
import type {
  PerguntaMultiplaEscolha,
  PerguntaQuiz,
  PerguntaVerdadeiroOuFalso
} from '@/core/unidade/tipos';

/** Estas três cadeiras só têm múltipla escolha; um verdadeiro ou falso aqui é erro de conteúdo. */
function soMultiplaEscolha(quiz: readonly PerguntaQuiz[]): readonly PerguntaMultiplaEscolha[] {
  return quiz.map((p) => {
    if (p.tipo === 'verdadeiro-ou-falso')
      throw new Error(`id ${p.id}: verdadeiro ou falso inesperado`);
    return p;
  });
}

const TODOS: ReadonlyArray<{
  nome: string;
  quiz: readonly PerguntaMultiplaEscolha[];
  alternativas: 4 | 5;
}> = [
  { nome: 'Introdução ao Direito', quiz: soMultiplaEscolha(quizIntr), alternativas: 4 },
  { nome: 'Redação Jurídica 1', quiz: soMultiplaEscolha(quizRedacao), alternativas: 4 },
  { nome: 'Sociologia Jurídica', quiz: soMultiplaEscolha(quizSociologia), alternativas: 5 }
];

/**
 * O motor embaralha as alternativas a cada rodada: a explicação não pode
 * apontar letra nem posição ("alternativa B", "a D", "acima"), só o
 * conteúdo da resposta. Vale para as quatro cadeiras.
 */
// Letras de alternativa em maiúscula, por isso sem a flag i (com ela, "de a" ou
// "o e a" seriam lidos como letras).
const CITA_LETRA =
  /\b(?:[Aa]lternativa|[Ll]etra|[Oo]p[çc][ãa]o)s?\s*\(?[A-E]\)?\b|\([A-E]\)|\b[Aa]s? [B-D]\b|\b[Ee] a [A-E]\b|\b[B-D] e [A-E]\b|\b[A-E] e [B-D]\b|\b(?:[Pp]rimeira|[Ss]egunda|[Tt]erceira|[Qq]uarta|[Qq]uinta|[Úú]ltima) (?:alternativa|op[çc][ãa]o)/;
// "acima"/"abaixo" só importam na explicação, onde apontariam para a ordem das
// respostas; no enunciado ("qual das frases abaixo") não dependem do sorteio.
const CITA_POSICAO = /\b(acima|abaixo)\b(?! do)/i;

function idsQueCitamLetra(quiz: readonly PerguntaQuiz[]): number[] {
  return quiz
    .filter(
      (p) =>
        CITA_LETRA.test(p.explicacaoHtml) ||
        CITA_POSICAO.test(p.explicacaoHtml.replace(/acima do homem/g, '')) ||
        CITA_LETRA.test(p.enunciadoHtml)
    )
    .map((p) => p.id);
}

describe.each(TODOS)('quiz de $nome', ({ quiz, alternativas }) => {
  it('ids únicos', () => {
    const ids = quiz.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it(`toda pergunta tem ${alternativas} alternativas e a correta cabe nelas`, () => {
    for (const p of quiz) {
      expect(p.alternativasHtml, `id ${p.id}`).toHaveLength(alternativas);
      expect(p.correta, `id ${p.id}`).toBeGreaterThanOrEqual(0);
      expect(p.correta, `id ${p.id}`).toBeLessThan(p.alternativasHtml.length);
    }
  });

  it('nenhuma alternativa ou explicação vazia, e toda categoria tem rótulo', () => {
    for (const p of quiz) {
      for (const a of p.alternativasHtml) expect(a.trim(), `id ${p.id}`).not.toBe('');
      expect(p.explicacaoHtml.trim(), `id ${p.id}`).not.toBe('');
      expect(ROTULOS_CATEGORIA_QUIZ[p.categoria], `id ${p.id}`).toBeTruthy();
    }
  });

  it('nenhuma explicação ou enunciado cita letra ou posição de alternativa', () => {
    expect(idsQueCitamLetra(quiz)).toEqual([]);
  });

  it('gabaritoDoCaderno, quando existe, é true (nunca false)', () => {
    for (const p of quiz) {
      if ('gabaritoDoCaderno' in p) expect(p.gabaritoDoCaderno, `id ${p.id}`).toBe(true);
    }
  });
});

describe('quiz de Sociologia Jurídica, conjunto', () => {
  it('tem 80 perguntas', () => {
    expect(quizSociologia).toHaveLength(80);
  });

  it('só usa as quatro categorias da unidade', () => {
    const cats = new Set(quizSociologia.map((p) => p.categoria));
    expect([...cats].sort()).toEqual(['aplicacao', 'atividade', 'classicos', 'conceitos']);
  });

  it('as 10 da atividade (ids 1 a 10) levam a marca do caderno e só elas', () => {
    const marcadas = quizSociologia.filter((p) => p.gabaritoDoCaderno === true);
    expect(marcadas).toHaveLength(10);
    expect(marcadas.map((p) => p.id).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    ]);
    expect(marcadas.every((p) => p.categoria === 'atividade')).toBe(true);
  });
});

describe('quiz de Filosofia Jurídica, conjunto', () => {
  const multipla = quizFilosofia.filter(
    (p): p is PerguntaMultiplaEscolha => p.tipo !== 'verdadeiro-ou-falso'
  );
  const verdadeiroOuFalso = quizFilosofia.filter(
    (p): p is PerguntaVerdadeiroOuFalso => p.tipo === 'verdadeiro-ou-falso'
  );

  it('tem 80 perguntas, ids únicos de 1 a 80', () => {
    expect(quizFilosofia).toHaveLength(80);
    expect(quizFilosofia.map((p) => p.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 80 }, (_, i) => i + 1)
    );
  });

  it('40 de múltipla escolha, cada uma com cinco alternativas não vazias e correta que cabe', () => {
    expect(multipla).toHaveLength(40);
    for (const p of multipla) {
      expect(p.alternativasHtml, `id ${p.id}`).toHaveLength(5);
      for (const a of p.alternativasHtml) expect(a.trim(), `id ${p.id}`).not.toBe('');
      expect(p.correta, `id ${p.id}`).toBeGreaterThanOrEqual(0);
      expect(p.correta, `id ${p.id}`).toBeLessThan(5);
    }
  });

  it('40 de verdadeiro ou falso, sem alternativasHtml e com correta booleana', () => {
    expect(verdadeiroOuFalso).toHaveLength(40);
    for (const p of verdadeiroOuFalso) {
      expect('alternativasHtml' in p, `id ${p.id}`).toBe(false);
      expect(typeof p.correta, `id ${p.id}`).toBe('boolean');
    }
  });

  it('as 20 do professor (ids 1 a 20) têm origem professor, são V/F e só elas', () => {
    const doProfessor = quizFilosofia.filter((p) => p.origem === 'professor');
    expect(doProfessor.map((p) => p.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1)
    );
    expect(doProfessor.every((p) => p.tipo === 'verdadeiro-ou-falso')).toBe(true);
  });

  it('nenhuma leva a nota do caderno (o gabarito é do professor)', () => {
    expect(quizFilosofia.filter((p) => 'gabaritoDoCaderno' in p)).toEqual([]);
  });

  it('nenhuma explicação ou enunciado cita letra ou posição de alternativa', () => {
    expect(idsQueCitamLetra(quizFilosofia.filter((p) => p.tipo !== 'verdadeiro-ou-falso'))).toEqual(
      []
    );
  });

  it('explicação preenchida e categoria com rótulo em todas', () => {
    for (const p of quizFilosofia) {
      expect(p.explicacaoHtml.trim(), `id ${p.id}`).not.toBe('');
      expect(ROTULOS_CATEGORIA_QUIZ[p.categoria], `id ${p.id}`).toBeTruthy();
    }
    expect(new Set(quizFilosofia.map((p) => p.categoria))).toEqual(
      new Set(['revisao', 'antiga', 'media'])
    );
  });
});
