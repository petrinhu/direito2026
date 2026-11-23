import { FISICA, KELSEN } from './constantes';

/** Estado do corpo do Kelsen: `pe` é a altura dos pés acima do chão, em px. */
export interface Jogador {
  readonly pe: number;
  readonly vy: number;
  readonly agachado: boolean;
}

/** Só salta do chão: no ar, a tecla não empilha um segundo pulo. */
export function saltar(jogador: Jogador): Jogador {
  if (jogador.pe > 0) return jogador;
  return { ...jogador, vy: FISICA.velocidadeSalto };
}

/** Integração semi-implícita (Euler): velocidade antes da posição. Estável com o passo fixo. */
export function passoDoJogador(jogador: Jogador, dt: number, agachar: boolean): Jogador {
  const agachado = agachar;
  let vy = jogador.vy - FISICA.gravidade * dt;
  let pe = jogador.pe + vy * dt;
  if (pe <= 0) {
    pe = 0;
    vy = 0;
  }
  return { pe, vy, agachado };
}

export function alturaDoCorpo(jogador: Jogador): number {
  return jogador.agachado ? KELSEN.alturaAgachado : KELSEN.alturaEmPe;
}
