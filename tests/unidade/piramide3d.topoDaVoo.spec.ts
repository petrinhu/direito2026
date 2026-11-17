import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { dimsRepouso, fatiasRepouso, razaoDoRepouso } from '@/core/piramide3d/geometria';
import { poseDeVoo } from '@/core/piramide3d/voo';

/**
 * PONTA (ordem do líder, 17/11): no voo para o primeiro plano, a Constituição (topo da pirâmide)
 * aparece como tronco cortado, sem o vértice. A razão de voo era a constante de fatia (0,84) para
 * todas as fatias; a razão do topo tem de ser a do repouso, perto de zero, para a ponta continuar ponta.
 */
const dimsDasFatias = fatiasRepouso(7).map(dimsRepouso);
const topo = dimsDasFatias[dimsDasFatias.length - 1]!;
const base = dimsDasFatias[0]!;

describe('o topo continua ponta no voo', () => {
  it('a razão de repouso do topo é perto de zero, e a da base é a de uma fatia larga', () => {
    expect(razaoDoRepouso(topo)).toBeLessThan(0.05);
    expect(razaoDoRepouso(base)).toBeGreaterThan(0.5);
  });

  it('na pose de voo, a ponta mantém a proporção de repouso: altura e profundidade não se anulam', () => {
    const camera = new THREE.PerspectiveCamera(26, 760 / 600, 0.05, 100);
    camera.position.set(
      0,
      1.5 + 9.7 * Math.sin((8 * Math.PI) / 180),
      9.7 * Math.cos((8 * Math.PI) / 180)
    );
    camera.lookAt(0, 1.5, 0);
    camera.updateMatrixWorld(true);
    const v = poseDeVoo({
      camera,
      rc: { x: 0, y: 0, w: 760, h: 600 },
      rv: { x: 0, y: 0, w: 1600, h: 1200 },
      apxPedido: 1.2,
      razao: razaoDoRepouso(topo),
      D: 9.7,
      alturaRelativa: topo.h / topo.LB
    });
    expect(v.d.LT / v.d.LB).toBeLessThan(0.05);
    expect(v.d.h / v.d.LB).toBeGreaterThan(0.5);
    expect(v.d.PT).toBeGreaterThanOrEqual(0);
  });

  it('na pose de voo, a face da ponta mantém a proporção da textura (altura sobre base = a do repouso), em qualquer largura', () => {
    const a = topo.h / topo.LB;
    for (const largura of [1280, 1920, 2560]) {
      const camera = new THREE.PerspectiveCamera(26, 760 / 600, 0.05, 100);
      camera.position.set(
        0,
        1.5 + 9.7 * Math.sin((8 * Math.PI) / 180),
        9.7 * Math.cos((8 * Math.PI) / 180)
      );
      camera.lookAt(0, 1.5, 0);
      camera.updateMatrixWorld(true);
      const v = poseDeVoo({
        camera,
        rc: { x: (largura - 760) / 2, y: 200, w: 760, h: 600 },
        rv: { x: 0, y: 0, w: largura, h: Math.round(largura * 0.625) },
        apxPedido: 0.4 * largura,
        razao: razaoDoRepouso(topo),
        D: 9.7,
        alturaRelativa: a
      });
      expect(v.d.h / v.d.LB).toBeGreaterThan(a * 0.99);
      expect(v.d.h / v.d.LB).toBeLessThan(a * 1.01);
    }
  });
});
