import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { posicoesTronco } from '@/core/piramide3d/geometria';
import type { DimensoesTronco } from '@/core/piramide3d/tipos';
import { aplicarPosicoesDaPeca } from '@/ui/piramide3d/geometriaPeca';

/**
 * PIR-BUG, sintoma 2 (ordem do líder, 16/11): a norma hipotética fundamental some às vezes. A câmera
 * descarta a malha pela esfera de recorte (frustumCulled). A esfera fica em cache e não acompanha a
 * geometria que cresce no voo: no voo medido, o raio em cache ficou em 0,373 e o real chegou a 1,79.
 * Este teste exige que, depois de aplicar a peça nova, a esfera cubra todos os vértices.
 */
const PEQUENA: DimensoesTronco = { LB: 0.2, LT: 0.1, PB: 0.2, PT: 0.1, h: 0.1 };
const GRANDE: DimensoesTronco = { LB: 2, LT: 1.4, PB: 2, PT: 1.4, h: 1.2 };

function vertices(pos: Float32Array): THREE.Vector3[] {
  const saida: THREE.Vector3[] = [];
  for (let i = 0; i < pos.length; i += 3)
    saida.push(new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2]));
  return saida;
}

describe('esfera de recorte da peça acompanha a geometria', () => {
  it('ao crescer a peça, a esfera em cache é recalculada e cobre todos os vértices', () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posicoesTronco(PEQUENA), 3));
    geo.computeBoundingSphere();
    const raioAntes = geo.boundingSphere!.radius;

    aplicarPosicoesDaPeca(geo, posicoesTronco(GRANDE));

    const esfera = geo.boundingSphere!;
    expect(esfera.radius).toBeGreaterThan(raioAntes);
    for (const v of vertices(posicoesTronco(GRANDE))) {
      expect(v.distanceTo(esfera.center)).toBeLessThanOrEqual(esfera.radius + 1e-6);
    }
  });
});
