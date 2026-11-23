import { describe, expect, it } from 'vitest';
import { FISICA, PASSO_FIXO_S } from '@/core/kelsenJump/constantes';
import { passoDoJogador, saltar, type Jogador } from '@/core/kelsenJump/fisica';

const EM_PE: Jogador = { pe: 0, vy: 0, agachado: false };

function simular(j: Jogador, segundos: number, agachar = false): { maxPe: number; j: Jogador } {
  let atual = j;
  let maxPe = j.pe;
  const passos = Math.round(segundos / PASSO_FIXO_S);
  for (let i = 0; i < passos; i++) {
    atual = passoDoJogador(atual, PASSO_FIXO_S, agachar);
    maxPe = Math.max(maxPe, atual.pe);
  }
  return { maxPe, j: atual };
}

describe('pulo', () => {
  it('saltar a partir do chão dá velocidade vertical positiva', () => {
    expect(saltar(EM_PE).vy).toBe(FISICA.velocidadeSalto);
  });

  it('não salta de novo no ar (sem pulo duplo)', () => {
    const noAr: Jogador = { pe: 40, vy: -100, agachado: false };
    expect(saltar(noAr)).toEqual(noAr);
  });

  it('o ápice fica próximo do previsto pela física (v²/2g)', () => {
    const { maxPe } = simular(saltar(EM_PE), 1.5);
    const previsto = FISICA.velocidadeSalto ** 2 / (2 * FISICA.gravidade);
    // Euler semi-implícito erra no máximo v·dt em relação à fórmula fechada.
    expect(Math.abs(maxPe - previsto)).toBeLessThan(FISICA.velocidadeSalto * PASSO_FIXO_S);
  });

  it('volta ao chão e para, sem afundar abaixo de zero', () => {
    const { j } = simular(saltar(EM_PE), 1.5);
    expect(j.pe).toBe(0);
    expect(j.vy).toBe(0);
  });

  it('agachar não muda o ápice do pulo: a tecla de abaixar é independente do salto', () => {
    const em = simular(saltar(EM_PE), 1.5, false).maxPe;
    const agachado = simular(saltar(EM_PE), 1.5, true).maxPe;
    expect(agachado).toBeCloseTo(em, 9);
    expect(passoDoJogador(EM_PE, PASSO_FIXO_S, true).agachado).toBe(true);
  });
});
