import { describe, expect, it } from 'vitest';
import { migrarRegistroLegado, type FontesMigracao } from '@/app/quiz/migrarRegistroLegado';
import { CORTES_QUIZ_CRESCEU } from '@/app/quiz/cortesQuizCresceu';
import { FORMAS_CONGELADAS } from '@/app/quiz/formasCongeladas';
import { embaralharRodada, ordemDaRodada } from '@/core/quiz/motor';
import type { ChaveUnidade, RegistroProgressoUnidade } from '@/core/progresso/tipos';
import type { FormaPergunta } from '@/core/quiz/tipos';
import type { IndiceAlternativa, PerguntaQuiz } from '@/core/unidade/tipos';
import { quiz as quizTeoriaPura } from '@/conteudo/p1/intr-direito/u3-livro-teoria-pura/quiz/index';
import { quiz as quizArtigos } from '@/conteudo/p1/sociologia-juridica/u3-artigos-infancia-digital/quiz/index';
import { quiz as quizFilosofia } from '@/conteudo/p1/filosofia-juridica/u3-moderna-contemporanea/quiz/index';

const CHAVE_INTRO = 'p1/intr-direito/u3-material-norma-interpretacao';
const CHAVE_ECA = 'p1/sociologia-juridica/u3-eca-digital';
const CHAVE_SEM_CORTE = 'p1/teste/u1';

/** Forma sintética com V/F no meio: a V/F não gasta sorteio, e a tradução tem de saber disso. */
const FORMA_TESTE: FormaPergunta[] = [
  { id: 1, tipo: 'mc', alternativas: 4 },
  { id: 2, tipo: 'vf', alternativas: 2 },
  { id: 3, tipo: 'mc', alternativas: 4 },
  { id: 4, tipo: 'mc', alternativas: 5 },
  { id: 5, tipo: 'vf', alternativas: 2 }
];

const FONTES_TESTE: FontesMigracao = {
  formas: { [CHAVE_SEM_CORTE]: FORMA_TESTE },
  cortes: {}
};

function legado(extra: Partial<RegistroProgressoUnidade> = {}): RegistroProgressoUnidade {
  return {
    versao: 1,
    atualizadoEm: '2026-11-01T00:00:00.000Z',
    blocosLidos: ['bloco-0'],
    ultimaAba: 'quiz',
    quizSemente: 42,
    quizRespostas: {},
    quizFinalizado: false,
    ...extra
  };
}

describe('migrarRegistroLegado: quando não mexe', () => {
  it('registro no formato novo passa intacto', () => {
    const novo = legado({ quizRespostasOriginais: { 1: 0 as IndiceAlternativa } });
    expect(migrarRegistroLegado(novo, CHAVE_SEM_CORTE, FONTES_TESTE)).toEqual(novo);
  });

  it('registro sem nenhum campo de quiz passa intacto', () => {
    const semQuiz: RegistroProgressoUnidade = {
      versao: 1,
      atualizadoEm: '2026-11-01T00:00:00.000Z',
      blocosLidos: [],
      ultimaAba: 'resumo'
    };
    const saida = migrarRegistroLegado(semQuiz, CHAVE_SEM_CORTE, FONTES_TESTE);
    expect(saida).toEqual(semQuiz);
    expect(saida.quizRespostasOriginais).toBeUndefined();
  });
});

describe('migrarRegistroLegado: zera quando não dá para traduzir com segurança', () => {
  it('unidade sem forma congelada: apaga o quiz e preserva lidos e aba', () => {
    const saida = migrarRegistroLegado(
      legado({ quizRespostas: { 1: 2 as IndiceAlternativa } }),
      'p9/sem/forma',
      FONTES_TESTE
    );
    expect(saida.quizSemente).toBeUndefined();
    expect(saida.quizRespostas).toBeUndefined();
    expect(saida.quizFinalizado).toBeUndefined();
    expect(saida.quizRespostasOriginais).toEqual({});
    expect(saida.blocosLidos).toEqual(['bloco-0']);
    expect(saida.ultimaAba).toBe('quiz');
  });

  it('respostas sem semente não têm como ser traduzidas: apaga o quiz', () => {
    const saida = migrarRegistroLegado(
      legado({ quizSemente: undefined, quizRespostas: { 1: 2 as IndiceAlternativa } }),
      CHAVE_SEM_CORTE,
      FONTES_TESTE
    );
    expect(saida.quizRespostas).toBeUndefined();
    expect(saida.quizRespostasOriginais).toEqual({});
  });
});

describe('migrarRegistroLegado: tradução pela forma congelada', () => {
  it('a resposta guardada pela ordem embaralhada vira a posição original, com V/F no meio da forma', () => {
    const semente = 42;
    const ordem = ordemDaRodada(FORMA_TESTE, semente);
    const respostasAntigas: Record<number, IndiceAlternativa> = { 1: 2, 3: 1, 4: 4 };
    const saida = migrarRegistroLegado(
      legado({ quizSemente: semente, quizRespostas: respostasAntigas, quizFinalizado: true }),
      CHAVE_SEM_CORTE,
      FONTES_TESTE
    );
    for (const [idStr, mostrada] of Object.entries(respostasAntigas)) {
      const id = Number(idStr);
      expect(saida.quizRespostasOriginais?.[id]).toBe(ordem.alternativas.get(id)![mostrada]);
    }
    expect(saida.quizRespostas).toBeUndefined();
    expect(saida.quizSemente).toBe(semente);
    expect(saida.quizFinalizado).toBe(true);
    expect(saida.quizIdsDaRodada).toEqual([1, 2, 3, 4, 5]);
  });

  it('com o conteúdo real, a tradução acerta em quiz com V/F (Teoria pura u3) e em Filosofia u3', () => {
    const semente = 777;
    const casos: Array<{ chave: ChaveUnidade; quiz: readonly PerguntaQuiz[] }> = [
      { chave: 'p1/intr-direito/u3-livro-teoria-pura', quiz: quizTeoriaPura },
      { chave: 'p1/filosofia-juridica/u3-moderna-contemporanea', quiz: quizFilosofia },
      { chave: 'p1/sociologia-juridica/u3-artigos-infancia-digital', quiz: quizArtigos }
    ];
    for (const { chave, quiz } of casos) {
      const rodada = embaralharRodada(quiz, semente);
      const respostas: Record<number, IndiceAlternativa> = {};
      for (const pergunta of rodada.perguntas) {
        respostas[pergunta.id] = (pergunta.id % pergunta.alternativasHtml.length) as IndiceAlternativa;
      }
      const saida = migrarRegistroLegado(
        legado({ quizSemente: semente, quizRespostas: respostas }),
        chave
      );
      for (const pergunta of rodada.perguntas) {
        const mostrada = respostas[pergunta.id]!;
        expect(saida.quizRespostasOriginais?.[pergunta.id]).toBe(pergunta.ordemOriginal[mostrada]);
      }
    }
  });

  it('a chave nova decide a forma: Sociologia u3 (endereço antigo) usa a forma de Artigos, de 40', () => {
    const forma = FORMAS_CONGELADAS['p1/sociologia-juridica/u3-artigos-infancia-digital'];
    expect(forma).toHaveLength(40);
    const saida = migrarRegistroLegado(
      legado({ quizSemente: 9, quizRespostas: { [forma![0]!.id]: 0 as IndiceAlternativa } }),
      'p1/sociologia-juridica/u3-artigos-infancia-digital'
    );
    expect(saida.quizIdsDaRodada).toHaveLength(40);
  });
});

describe('migrarRegistroLegado: corte de Introdução u3 e ECA (instantes de publicado, AV3-K4)', () => {
  const corteIntro = Date.parse(CORTES_QUIZ_CRESCEU[CHAVE_INTRO]!);
  const corteEca = Date.parse(CORTES_QUIZ_CRESCEU[CHAVE_ECA]!);

  function comData(chave: ChaveUnidade, atualizadoEm: string): RegistroProgressoUnidade {
    return migrarRegistroLegado(legado({ atualizadoEm, quizSemente: 2026, quizRespostas: {} }), chave);
  }

  it('o corte de Introdução é 16:07:25 de 13/11 em -03:00, e o de ECA é 09:16:34 no mesmo dia', () => {
    expect(corteIntro).toBe(Date.parse('2026-11-13T19:07:25.000Z'));
    expect(corteEca).toBe(Date.parse('2026-11-13T12:16:34.000Z'));
  });

  it('Introdução: 1 ms antes do corte zera; no instante exato traduz; 1 ms depois traduz', () => {
    expect(comData(CHAVE_INTRO, '2026-11-13T19:07:24.999Z').quizSemente).toBeUndefined();
    expect(comData(CHAVE_INTRO, '2026-11-13T19:07:25.000Z').quizSemente).toBe(2026);
    expect(comData(CHAVE_INTRO, '2026-11-13T19:07:25.001Z').quizSemente).toBe(2026);
  });

  it('Introdução: um minuto antes zera e data em -03:00 é comparada pelo instante, não pelo texto', () => {
    expect(comData(CHAVE_INTRO, '2026-11-13T19:06:25.000Z').quizSemente).toBeUndefined();
    expect(comData(CHAVE_INTRO, '2026-11-13T16:07:24.999-03:00').quizSemente).toBeUndefined();
    expect(comData(CHAVE_INTRO, '2026-11-13T16:07:25.000-03:00').quizSemente).toBe(2026);
  });

  it('ECA: 1 ms antes do corte zera; no instante exato traduz', () => {
    expect(comData(CHAVE_ECA, '2026-11-13T12:16:33.999Z').quizSemente).toBeUndefined();
    expect(comData(CHAVE_ECA, '2026-11-13T12:16:34.000Z').quizSemente).toBe(2026);
  });

  it('data inválida zera (não há como provar que a resposta é posterior ao corte)', () => {
    expect(comData(CHAVE_INTRO, 'nao-e-uma-data').quizSemente).toBeUndefined();
    expect(comData(CHAVE_ECA, '').quizSemente).toBeUndefined();
  });
});
