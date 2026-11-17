import type * as THREE from 'three';

/**
 * Copia as posições novas para a geometria da peça e recalcula a esfera de recorte. Sem isso, a
 * câmera usa a esfera do primeiro quadro e descarta a peça quando ela cresce (PIR-BUG, sintoma 2).
 */
export function aplicarPosicoesDaPeca(geo: THREE.BufferGeometry, pos: ArrayLike<number>): void {
  const posicao = geo.getAttribute('position') as THREE.BufferAttribute;
  posicao.array.set(pos);
  posicao.needsUpdate = true;
  geo.computeBoundingSphere();
}
