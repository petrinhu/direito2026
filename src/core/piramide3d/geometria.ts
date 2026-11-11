import type { DimensoesTronco, Fatia } from './tipos';

// Geometria em repouso da pirâmide. Funções puras, sem biblioteca gráfica.
// Proporção egípcia: altura/base = 7/11.
export const BASE = 2.2;
export const ALTURA = 1.4;
export const FOLGA = 0.02;
export const LARGURA_PONTA = 0.004;

/** Rotação do conjunto inteiro em torno do eixo vertical, em repouso. */
export const GIRO = 0.3;

/** Um canto de tronco: x, y, z. */
export type Canto = readonly [number, number, number];

/** Largura da pirâmide ideal na altura y. */
export function larguraEm(y: number): number {
  return BASE * (1 - y / ALTURA);
}

/** n fatias de altura igual, empilhadas do plano y=0 até o ápice. A folga entre elas sai da altura. */
export function fatiasRepouso(n: number): Fatia[] {
  const h = (ALTURA - (n - 1) * FOLGA) / n;
  const fatias: Fatia[] = [];
  for (let k = 0; k < n; k++) {
    const base = k * (h + FOLGA);
    const topo = base + h;
    const LB = larguraEm(base);
    const LT = k === n - 1 ? LARGURA_PONTA : larguraEm(topo);
    fatias.push({ base, topo, LB, LT });
  }
  return fatias;
}

export function envelope(): { base: number; altura: number } {
  return { base: BASE, altura: ALTURA };
}

/** Ângulo da face (graus) entre a base e a face lateral, pela reta da pirâmide ideal. */
export function inclinacaoFaceGraus(): number {
  return (Math.atan2(ALTURA, BASE / 2) * 180) / Math.PI;
}

/**
 * Dois blocos retos acima do ápice, fora da série. O de baixo é a Constituição em sentido lógico;
 * o de cima, a norma fundamental.
 */
export function blocosNorma(): [Fatia, Fatia] {
  const baixo = ALTURA + 0.18;
  const cima = baixo + 0.24 + 0.04;
  return [
    { base: baixo, topo: baixo + 0.24, LB: 0.5, LT: 0.5 },
    { base: cima, topo: cima + 0.24, LB: 0.5, LT: 0.5 }
  ];
}

/** Dimensões de uma peça em repouso: tronco de seção quadrada, por isso PB=LB e PT=LT. */
export function dimsRepouso(f: Fatia): DimensoesTronco {
  return { LB: f.LB, LT: f.LT, PB: f.LB, PT: f.LT, h: f.topo - f.base };
}

/**
 * Os 8 cantos de um tronco centrado na origem. Ordem fixa: 0..3 base (frente esquerda, frente
 * direita, trás direita, trás esquerda), 4..7 topo, na mesma ordem.
 */
export function cantosTronco(d: DimensoesTronco): Canto[] {
  const hb = d.h / 2;
  const bx = d.LB / 2;
  const tx = d.LT / 2;
  const pb = d.PB / 2;
  const pt = d.PT / 2;
  return [
    [-bx, -hb, pb],
    [bx, -hb, pb],
    [bx, -hb, -pb],
    [-bx, -hb, -pb],
    [-tx, hb, pt],
    [tx, hb, pt],
    [tx, hb, -pt],
    [-tx, hb, -pt]
  ];
}

type Quadrilatero = readonly [number, number, number, number];

// Faces como quadriláteros, a da frente (+z) primeiro, depois as demais.
const FACES: readonly Quadrilatero[] = [
  [0, 1, 5, 4],
  [1, 2, 6, 5],
  [2, 3, 7, 6],
  [3, 0, 4, 7],
  [4, 5, 6, 7],
  [3, 2, 1, 0]
];

const ARESTAS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7]
];

/** Pega o canto de índice i; os índices das tabelas acima são sempre de 0 a 7. */
function canto(cantos: readonly Canto[], i: number): Canto {
  const c = cantos[i];
  if (c === undefined) throw new Error(`canto ${i} fora do tronco`);
  return c;
}

/** 36 vértices (6 faces, 2 triângulos cada), como array plano de posições. */
export function posicoesTronco(d: DimensoesTronco): Float32Array {
  const c = cantosTronco(d);
  const out = new Float32Array(36 * 3);
  let k = 0;
  const por = (i: number): void => {
    const [x, y, z] = canto(c, i);
    out[k++] = x;
    out[k++] = y;
    out[k++] = z;
  };
  for (const [a, b, cc, dd] of FACES) {
    por(a);
    por(b);
    por(cc);
    por(a);
    por(cc);
    por(dd);
  }
  return out;
}

/** 12 arestas como pares de pontos (72 números), para o contorno. */
export function arestasTronco(d: DimensoesTronco): Float32Array {
  const c = cantosTronco(d);
  const out = new Float32Array(ARESTAS.length * 6);
  ARESTAS.forEach(([a, b], n) => {
    out.set(canto(c, a), n * 6);
    out.set(canto(c, b), n * 6 + 3);
  });
  return out;
}

/** Os 4 cantos da face da frente, na ordem base-esq, base-dir, topo-dir, topo-esq. */
export function cantosFaceFrente(d: DimensoesTronco): [Canto, Canto, Canto, Canto] {
  const c = cantosTronco(d);
  return [canto(c, 0), canto(c, 1), canto(c, 5), canto(c, 4)];
}
