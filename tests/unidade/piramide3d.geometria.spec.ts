import { describe, expect, it } from 'vitest';
import {
  ALTURA,
  BASE,
  LARGURA_PONTA,
  arestasTronco,
  blocosNorma,
  cantosFaceFrente,
  cantosTronco,
  dimsRepouso,
  envelope,
  fatiasRepouso,
  inclinacaoFaceGraus,
  posicoesTronco
} from '@/core/piramide3d/geometria';

describe('geometria em repouso', () => {
  it('proporção egípcia: altura sobre base entre 0,630 e 0,643', () => {
    const e = envelope();
    expect(e.altura / e.base).toBeGreaterThanOrEqual(0.63);
    expect(e.altura / e.base).toBeLessThanOrEqual(0.643);
  });

  it('inclinação da face entre 51,3 e 52,4 graus', () => {
    expect(inclinacaoFaceGraus()).toBeGreaterThanOrEqual(51.3);
    expect(inclinacaoFaceGraus()).toBeLessThanOrEqual(52.4);
  });

  it.each([4, 5])('%i fatias: altura igual, base em y=0, topo no ápice, ponta de 0,004', (n) => {
    const fatias = fatiasRepouso(n);
    expect(fatias).toHaveLength(n);
    const alturas = fatias.map((f) => f.topo - f.base);
    for (const h of alturas) expect(h).toBeCloseTo(alturas[0] as number, 9);
    expect(fatias[0]?.base).toBeCloseTo(0, 9);
    const ultima = fatias[n - 1];
    expect(ultima?.topo).toBeCloseTo(ALTURA, 9);
    expect(ultima?.LT).toBeCloseTo(LARGURA_PONTA, 9);
  });

  it('a base da primeira fatia é a base da pirâmide', () => {
    expect(fatiasRepouso(5)[0]?.LB).toBeCloseTo(BASE, 9);
  });

  it('os dois blocos da norma ficam acima do ápice, sem encostar na pirâmide nem um no outro', () => {
    const [baixo, cima] = blocosNorma();
    expect(baixo.base).toBeGreaterThan(ALTURA);
    expect(cima.base).toBeGreaterThan(baixo.topo);
  });

  it('o tronco tem 8 cantos, 36 vértices e 12 arestas', () => {
    const d = dimsRepouso({ base: 0, topo: 1, LB: 2, LT: 1 });
    expect(cantosTronco(d)).toHaveLength(8);
    expect(posicoesTronco(d)).toHaveLength(36 * 3);
    expect(arestasTronco(d)).toHaveLength(12 * 6);
  });

  it('a face da frente é a de z positivo, de baixo para cima e da esquerda para a direita', () => {
    const d = { LB: 2, LT: 1, PB: 2, PT: 1, h: 4 };
    const [be, bd, td, te] = cantosFaceFrente(d);
    expect(be).toEqual([-1, -2, 1]);
    expect(bd).toEqual([1, -2, 1]);
    expect(td).toEqual([0.5, 2, 0.5]);
    expect(te).toEqual([-0.5, 2, 0.5]);
  });
});
