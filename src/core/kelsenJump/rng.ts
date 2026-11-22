/**
 * Gerador pseudoaleatório de semente explícita (mulberry32). O estado é só um número, então a
 * partida inteira fica reproduzível e testável. Nunca use Math.random no core.
 */
export interface Sorteio {
  readonly valor: number;
  readonly semente: number;
}

export function sortear(semente: number): Sorteio {
  const s = (semente + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const valor = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { valor, semente: s };
}
