import { describe, expect, it } from 'vitest';
import { migrarRegistroLegado, type FontesMigracao } from '@/app/quiz/migrarRegistroLegado';
import { FORMAS_CONGELADAS } from '@/app/quiz/formasCongeladas';
import { QUIZZES_QUE_CRESCERAM } from '@/app/quiz/quizzesQueCresceram';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { embaralharRodada, ordemDaRodada } from '@/core/quiz/motor';
import type { ChaveUnidade, RegistroProgressoUnidade } from '@/core/progresso/tipos';
import type { FormaPergunta } from '@/core/quiz/tipos';
import type {
  IndiceAlternativa,
  PerguntaMultiplaEscolha,
  PerguntaQuiz
} from '@/core/unidade/tipos';
import { quiz as quizFilosofia } from '@/conteudo/p1/filosofia-juridica/u3-moderna-contemporanea/quiz/index';
import { quiz as quizTeoriaPura } from '@/conteudo/p1/intr-direito/u3-livro-teoria-pura/quiz/index';
import { quiz as quizArtigos } from '@/conteudo/p1/sociologia-juridica/u3-artigos-infancia-digital/quiz/index';

const CHAVE_INTRO = 'p1/intr-direito/u3-material-norma-interpretacao';
const CHAVE_ECA = 'p1/sociologia-juridica/u3-eca-digital';
const CHAVE_ARTIGOS = 'p1/sociologia-juridica/u3-artigos-infancia-digital';
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
  zerarLegado: []
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

  it('com o conteúdo real, a tradução acerta em quiz com V/F (Teoria pura u3) e em Artigos', () => {
    const semente = 777;
    const casos: Array<{ chave: ChaveUnidade; quiz: readonly PerguntaQuiz[] }> = [
      { chave: 'p1/intr-direito/u3-livro-teoria-pura', quiz: quizTeoriaPura },
      { chave: CHAVE_ARTIGOS, quiz: quizArtigos }
    ];
    for (const { chave, quiz } of casos) {
      const rodada = embaralharRodada(quiz, semente);
      const respostas: Record<number, IndiceAlternativa> = {};
      for (const pergunta of rodada.perguntas) {
        respostas[pergunta.id] = (pergunta.id %
          pergunta.alternativasHtml.length) as IndiceAlternativa;
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
    const forma = FORMAS_CONGELADAS[CHAVE_ARTIGOS];
    expect(forma).toHaveLength(40);
    const saida = migrarRegistroLegado(
      legado({ quizSemente: 9, quizRespostas: { [forma![0]!.id]: 0 as IndiceAlternativa } }),
      CHAVE_ARTIGOS
    );
    expect(saida.quizIdsDaRodada).toHaveLength(40);
  });
});

describe('migrarRegistroLegado: Introdução u3 e ECA zeram todo legado (opção c, decisão do líder de 13/11/2026)', () => {
  it('Introdução: legado respondido antes do corte e tocado depois zera (o resíduo que o corte por data não fechava)', () => {
    const saida = migrarRegistroLegado(
      legado({
        atualizadoEm: '2026-11-13T20:00:00.000Z',
        quizSemente: 2026,
        quizRespostas: { 1: 0 as IndiceAlternativa }
      }),
      CHAVE_INTRO
    );
    expect(saida.quizSemente).toBeUndefined();
    expect(saida.quizRespostas).toBeUndefined();
    expect(saida.quizRespostasOriginais).toEqual({});
  });

  it('Filosofia u3: a tradução preserva o mesmo texto de alternativa de antes do crescimento', () => {
    const chave = 'p1/filosofia-juridica/u3-moderna-contemporanea';
    const semente = 2026;
    // Rodada de antes do crescimento: a forma congelada da v1.9 (20 perguntas de 4 alternativas).
    const hoje = ordemDaRodada(FORMAS_CONGELADAS[chave]!, semente);
    const respostas: Record<number, IndiceAlternativa> = {};
    for (const id of hoje.ids) respostas[id] = (id % 4) as IndiceAlternativa;
    const saida = migrarRegistroLegado(
      legado({ quizSemente: semente, quizRespostas: respostas }),
      chave
    );
    // Conteúdo vivo, já crescido: as alternativas antigas seguem nas posições 0 a 3.
    const depois = embaralharRodada(quizFilosofia, semente);
    for (const id of hoje.ids) {
      const original = hoje.alternativas.get(id)![respostas[id]!]!;
      const textoDeAntes = (quizFilosofia.find((p) => p.id === id) as PerguntaMultiplaEscolha)
        .alternativasHtml[original];
      const pergunta = depois.perguntas.find((p) => p.id === id)!;
      const indiceDepois = pergunta.ordemOriginal.indexOf(saida.quizRespostasOriginais![id]!);
      expect(pergunta.alternativasHtml[indiceDepois], `pergunta ${id}`).toBe(textoDeAntes);
    }
  });

  it('ECA: legado zera mesmo com atualizadoEm depois do crescimento', () => {
    const saida = migrarRegistroLegado(
      legado({
        atualizadoEm: '2026-11-14T10:00:00.000Z',
        quizSemente: 2026,
        quizRespostas: { 1: 0 as IndiceAlternativa }
      }),
      CHAVE_ECA
    );
    expect(saida.quizSemente).toBeUndefined();
    expect(saida.quizRespostasOriginais).toEqual({});
  });

  it('Introdução e ECA: legado zera também com data inválida ou anterior ao crescimento', () => {
    for (const chave of [CHAVE_INTRO, CHAVE_ECA]) {
      expect(
        migrarRegistroLegado(legado({ atualizadoEm: 'nao-e-data', quizSemente: 2026 }), chave)
          .quizSemente
      ).toBeUndefined();
      expect(
        migrarRegistroLegado(
          legado({ atualizadoEm: '2026-11-01T00:00:00.000Z', quizSemente: 2026 }),
          chave
        ).quizSemente
      ).toBeUndefined();
    }
  });

  it('quiz que não cresceu segue traduzido: Artigos (endereço antigo de Sociologia u3) não zera', () => {
    const primeiraId = FORMAS_CONGELADAS[CHAVE_ARTIGOS]![0]!.id;
    const saida = migrarRegistroLegado(
      legado({ quizSemente: 9, quizRespostas: { [primeiraId]: 0 as IndiceAlternativa } }),
      CHAVE_ARTIGOS
    );
    expect(saida.quizSemente).toBe(9);
    expect(saida.quizRespostasOriginais?.[primeiraId]).toBeDefined();
  });
});

describe('migrarRegistroLegado: a lista de quizzes que cresceram é fixa, e os outros traduzem sem perda (AV3-K4)', () => {
  it('a lista é exatamente Introdução u3 material e ECA Digital', () => {
    expect([...QUIZZES_QUE_CRESCERAM].sort()).toEqual(
      [
        'p1/intr-direito/u3-material-norma-interpretacao',
        'p1/sociologia-juridica/u3-eca-digital'
      ].sort()
    );
  });

  it('legado de Filosofia u1 (nunca cresceu, tem V/F) traduz com o conteúdo real, sem zerar', async () => {
    const chave = 'p1/filosofia-juridica/u1';
    const conteudo = await CARREGADORES[chave]!();
    const quiz = conteudo.quiz!;
    const semente = 314;
    const rodada = embaralharRodada(quiz, semente);
    const respostas: Record<number, IndiceAlternativa> = {};
    for (const pergunta of rodada.perguntas) {
      respostas[pergunta.id] = (pergunta.id %
        pergunta.alternativasHtml.length) as IndiceAlternativa;
    }
    const saida = migrarRegistroLegado(
      legado({ quizSemente: semente, quizRespostas: respostas }),
      chave
    );
    expect(saida.quizSemente).toBe(semente);
    for (const pergunta of rodada.perguntas) {
      const mostrada = respostas[pergunta.id]!;
      expect(saida.quizRespostasOriginais?.[pergunta.id]).toBe(pergunta.ordemOriginal[mostrada]);
    }
  });
});
