import { VELOCIDADE } from './constantes';

/** Velocidade do cenário em px/s, no tempo de corrida `tempoS` (segundos). Cresce linear e para no teto. */
export function velocidadeEm(tempoS: number): number {
  return Math.min(VELOCIDADE.maxima, VELOCIDADE.minima + VELOCIDADE.aceleracao * tempoS);
}
