import { describe, expect, it } from 'vitest';
import { quizConforme } from '../../scripts/apoio/contagemQuiz';
import type { PerguntaQuiz } from '@/core/unidade/tipos';

/**
 * Portão de contagem do quiz de Filosofia AV3 (decisão do líder, 14/11/2026): no MÍNIMO 80
 * perguntas, com no mínimo 40 de múltipla escolha de 5 alternativas e no mínimo 40 de
 * verdadeiro ou falso. Mais perguntas passam (a revisão do Warat acrescenta 8). Conteúdo
 * SINTÉTICO aqui: nenhuma pergunta real entra neste teste.
 */
function mc(id: number, alternativas = 5): PerguntaQuiz {
  return {
    id,
    categoria: 'filosofia-moderna',
    enunciadoHtml: `M${id}`,
    alternativasHtml: Array.from({ length: alternativas }, (_, i) => `alt ${i}`),
    correta: 0,
    fonteExtra: false,
    explicacaoHtml: 'x'
  } as PerguntaQuiz;
}

function vf(id: number): PerguntaQuiz {
  return {
    id,
    categoria: 'filosofia-moderna',
    enunciadoHtml: `V${id}`,
    tipo: 'verdadeiro-ou-falso',
    correta: true,
    fonteExtra: false,
    explicacaoHtml: 'x'
  } as PerguntaQuiz;
}

/** n perguntas: as primeiras `mcs` de múltipla escolha e o resto de verdadeiro ou falso. */
function quizCom(mcs: number, vfs: number): PerguntaQuiz[] {
  const todas: PerguntaQuiz[] = [];
  for (let i = 1; i <= mcs; i++) todas.push(mc(i));
  for (let i = 1; i <= vfs; i++) todas.push(vf(mcs + i));
  return todas;
}

describe('quizConforme: no mínimo 80, com 40 de múltipla escolha e 40 de verdadeiro ou falso', () => {
  it('79 perguntas (40 de múltipla escolha e 39 de V/F) reprovam', () => {
    expect(quizConforme(quizCom(40, 39))).toBe(false);
  });

  it('80 perguntas exatas (40 e 40) passam', () => {
    expect(quizConforme(quizCom(40, 40))).toBe(true);
  });

  it('88 perguntas (44 e 44) passam: o mínimo, não o exato', () => {
    expect(quizConforme(quizCom(44, 44))).toBe(true);
  });

  it('múltipla escolha com 4 alternativas reprova, mesmo com 80 no total', () => {
    const quiz = quizCom(40, 40);
    quiz[0] = mc(1, 4);
    expect(quizConforme(quiz)).toBe(false);
  });

  it('ids que não são 1 a n em sequência reprovam', () => {
    const quiz = quizCom(40, 40);
    quiz[5] = { ...quiz[5]!, id: 999 };
    expect(quizConforme(quiz)).toBe(false);
  });

  it('pergunta sem explicação reprova', () => {
    const quiz = quizCom(40, 40);
    quiz[0] = { ...quiz[0]!, explicacaoHtml: '' } as PerguntaQuiz;
    expect(quizConforme(quiz)).toBe(false);
  });
});

describe('quizConforme: piso de varredura', () => {
  it('quiz vazio reprova (zero seria varredura quebrada, não conteúdo limpo)', () => {
    expect(quizConforme([])).toBe(false);
  });
});
