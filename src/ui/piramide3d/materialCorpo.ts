import * as THREE from 'three';

/**
 * Opções do material do corpo comum (fatia e ponta). Sem escrita de profundidade: o corpo é transparente,
 * e a face de texto, desenhada depois dele no mesmo plano, não pode ficar atrás da malha (captura do líder,
 * 17/11: a face clara cobria o texto no voo).
 */
export const OPCOES_DO_CORPO_COMUM = {
  vertexColors: true,
  roughness: 0.55,
  metalness: 0.05,
  flatShading: true,
  transparent: true,
  opacity: 1,
  depthWrite: false,
  side: THREE.DoubleSide
} as const;
