import { sortear } from './rng';

/** Índice da lição sorteada para a semente, entre 0 e total - 1. */
export function escolherIndiceLicao(semente: number, total: number): number {
  if (total <= 0) throw new RangeError('escolherIndiceLicao: total precisa ser positivo');
  return Math.min(total - 1, Math.floor(sortear(semente).valor * total));
}
