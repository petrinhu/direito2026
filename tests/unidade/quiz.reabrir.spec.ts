import { describe, expect, it } from 'vitest';
import { deveReabrirRodada } from '@/app/quiz/reabrir';
import type { RegistroProgressoUnidade } from '@/core/progresso/tipos';
import type { IndiceAlternativa } from '@/core/unidade/tipos';

type Campos = Pick<RegistroProgressoUnidade, 'quizFinalizado' | 'quizIdsDaRodada' | 'quizRespostasOriginais'>;

/** Rodada de 3 perguntas, finalizada com todas respondidas. */
const FINALIZADA: Campos = {
  quizFinalizado: true,
  quizIdsDaRodada: [1, 2, 3],
  quizRespostasOriginais: { 1: 0 as IndiceAlternativa, 2: 1 as IndiceAlternativa, 3: 2 as IndiceAlternativa }
};

describe('deveReabrirRodada (AV3-K4, decisão do líder: reabrir só as novas)', () => {
  it('cresceu e tem pergunta nova sem resposta: reabre', () => {
    expect(deveReabrirRodada(FINALIZADA, [1, 2, 3, 4])).toBe(true);
  });

  it('não cresceu e tinha pergunta em branco: não reabre', () => {
    const comBranco: Campos = {
      ...FINALIZADA,
      quizRespostasOriginais: { 1: 0 as IndiceAlternativa }
    };
    expect(deveReabrirRodada(comBranco, [1, 2, 3])).toBe(false);
  });

  it('cresceu, mas o aluno já respondeu as perguntas novas: não reabre', () => {
    const respondeuNovas: Campos = {
      ...FINALIZADA,
      quizRespostasOriginais: { 1: 0 as IndiceAlternativa, 2: 1 as IndiceAlternativa, 3: 2 as IndiceAlternativa, 4: 0 as IndiceAlternativa }
    };
    expect(deveReabrirRodada(respondeuNovas, [1, 2, 3, 4])).toBe(false);
  });

  it('rodada que não está finalizada: não mexe', () => {
    expect(deveReabrirRodada({ ...FINALIZADA, quizFinalizado: false }, [1, 2, 3, 4])).toBe(false);
  });

  it('sem quizIdsDaRodada (registro que não tem essa informação): não reabre', () => {
    expect(deveReabrirRodada({ ...FINALIZADA, quizIdsDaRodada: undefined }, [1, 2, 3, 4])).toBe(false);
  });
});
