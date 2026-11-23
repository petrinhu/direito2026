import { describe, expect, it } from 'vitest';
import { REINICIO_TRAVA_S } from '@/core/kelsenJump/constantes';
import { estadoInicial, type Estado } from '@/core/kelsenJump/partida';
import { cenaDe, tremorDe } from '@/app/kelsenJump/cena';

/** Estado em corrida, no chão, com a distância dada. */
function correndo(distancia: number, agachado = false): Estado {
  return {
    ...estadoInicial(1),
    fase: 'correndo',
    distancia,
    jogador: { pe: 0, vy: 0, agachado }
  };
}

describe('pose do Kelsen escolhida pelo estado', () => {
  it('antes da primeira partida o boneco está parado', () => {
    const corpo = cenaDe(estadoInicial(1)).corpo;
    expect(corpo.pose).toBe('parado');
    expect(corpo.tremor).toBe(0);
  });

  it('em corrida alterna os dois quadros a cada passo de animação', () => {
    const a = cenaDe(correndo(0)).corpo;
    const b = cenaDe(correndo(18)).corpo;
    expect(a.pose).toBe('correndo');
    expect(b.pose).toBe('correndo');
    expect(a.quadro).not.toBe(b.quadro);
  });

  it('no ar mostra o quadro de corrida congelado', () => {
    const noAr = { ...correndo(0), jogador: { pe: 40, vy: 100, agachado: false } };
    const corpo = cenaDe(noAr).corpo;
    expect(corpo.pose).toBe('pulando');
    expect(corpo.quadro).toBe(1);
  });

  it('agachado alterna os dois quadros de abaixado', () => {
    const a = cenaDe(correndo(0, true)).corpo;
    const b = cenaDe(correndo(18, true)).corpo;
    expect(a.pose).toBe('abaixado');
    expect(a.quadro).not.toBe(b.quadro);
  });

  it('depois de uma colisão a tela de fim mostra a batida, com tremor no começo', () => {
    const batido = estadoInicial(1, 10, REINICIO_TRAVA_S);
    const corpo = cenaDe(batido).corpo;
    expect(corpo.pose).toBe('batida');
    expect(corpo.tremor).toBe(3);
  });

  it('o tremor some quando a trava acaba', () => {
    expect(tremorDe(0)).toBe(0);
    expect(tremorDe(REINICIO_TRAVA_S)).toBe(3);
    expect(tremorDe(REINICIO_TRAVA_S - 0.05)).toBe(-3);
    expect(tremorDe(REINICIO_TRAVA_S - 0.1)).toBe(2);
    expect(tremorDe(REINICIO_TRAVA_S - 0.2)).toBe(0);
  });
});
