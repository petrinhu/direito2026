import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { centroFaceFrente, dimsRepouso, fatiasRepouso } from '@/core/piramide3d/geometria';

/**
 * PIR-LINHAS (ordem do líder, 17/11): as linhas dos rótulos apontam para a borda entre duas fatias, e
 * não para a face certa. A âncora era o eixo da peça (z = 0), que fica atrás da face da frente e aparece
 * mais alto na tela. A âncora passa a ser o centro da face da frente. Testes com a câmera de
 * src/ui/piramide3d/cena.ts (D = 9,7; elevação de 8 graus; FOV 26; canvas 760 por 600).
 */
const D = 9.7;
const ELEVACAO = (8 * Math.PI) / 180;
const dimsDasFatias = fatiasRepouso(7).map(dimsRepouso);
const camera = new THREE.PerspectiveCamera(26, 760 / 600, 0.05, 100);
camera.position.set(0, 1.5 + D * Math.sin(ELEVACAO), D * Math.cos(ELEVACAO));
camera.lookAt(0, 1.5, 0);
camera.updateMatrixWorld(true);

function projetar(v: THREE.Vector3): { x: number; y: number } {
  const p = v.clone().project(camera);
  return { x: p.x, y: p.y };
}

function quadrilateroDaFrente(d: (typeof dimsDasFatias)[number]): { x: number; y: number }[] {
  return [
    new THREE.Vector3(-d.LB / 2, -d.h / 2, d.PB / 2),
    new THREE.Vector3(d.LB / 2, -d.h / 2, d.PB / 2),
    new THREE.Vector3(d.LT / 2, d.h / 2, d.PT / 2),
    new THREE.Vector3(-d.LT / 2, d.h / 2, d.PT / 2)
  ].map(projetar);
}

function dentroDoQuadrilatero(
  pts: { x: number; y: number }[],
  p: { x: number; y: number }
): boolean {
  let dentro = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i]!;
    const b = pts[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      dentro = !dentro;
  }
  return dentro;
}

describe('âncora dos rótulos cai na face da frente', () => {
  it('o centro da face fica no plano da frente, no meio da altura da fatia', () => {
    for (const d of dimsDasFatias) {
      const [x, y, z] = centroFaceFrente(d);
      expect(x).toBeCloseTo(0, 9);
      expect(y).toBeCloseTo(0, 9);
      expect(z).toBeGreaterThan(0);
    }
  });

  it('em cada fatia, a âncora projetada cai dentro da face projetada', () => {
    for (const d of dimsDasFatias) {
      const ancora = projetar(new THREE.Vector3(...centroFaceFrente(d)));
      expect(dentroDoQuadrilatero(quadrilateroDaFrente(d), ancora)).toBe(true);
    }
  });

  it('o eixo (z = 0) projeta mais alto na tela do que o centro da face, em todas as fatias', () => {
    for (const d of dimsDasFatias) {
      const eixo = projetar(new THREE.Vector3(0, 0, 0));
      const centro = projetar(new THREE.Vector3(...centroFaceFrente(d)));
      expect(eixo.y).toBeGreaterThan(centro.y);
    }
  });
});
