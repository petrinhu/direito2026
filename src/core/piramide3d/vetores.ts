// Vetores e quatérnios mínimos para a pose de voo. As fórmulas são as da biblioteca gráfica
// (Vector3.applyQuaternion, Quaternion.multiply e setFromAxisAngle), reescritas aqui para o core
// rodar sem ela; tests/unidade/piramide3d.voo.spec.ts confere as duas lado a lado.
import type { Quaternio, Vetor3 } from './tipos';

export const EIXO_X: Vetor3 = { x: 1, y: 0, z: 0 };
export const EIXO_Y: Vetor3 = { x: 0, y: 1, z: 0 };
export const EIXO_Z: Vetor3 = { x: 0, y: 0, z: 1 };

export function somar(a: Vetor3, b: Vetor3): Vetor3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtrair(a: Vetor3, b: Vetor3): Vetor3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function somarEscalado(a: Vetor3, b: Vetor3, k: number): Vetor3 {
  return { x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k };
}

export function negar(a: Vetor3): Vetor3 {
  return { x: -a.x, y: -a.y, z: -a.z };
}

/** Quatérnio de rotação de `angulo` radianos em torno de um eixo unitário. */
export function quaternioDeEixo(eixo: Vetor3, angulo: number): Quaternio {
  const metade = angulo / 2;
  const s = Math.sin(metade);
  return { x: eixo.x * s, y: eixo.y * s, z: eixo.z * s, w: Math.cos(metade) };
}

/** Produto a * b: aplica b primeiro, depois a. */
export function multiplicarQuaternios(a: Quaternio, b: Quaternio): Quaternio {
  return {
    x: a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y,
    y: a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z,
    z: a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
  };
}

export function rotacionar(v: Vetor3, q: Quaternio): Vetor3 {
  const tx = 2 * (q.y * v.z - q.z * v.y);
  const ty = 2 * (q.z * v.x - q.x * v.z);
  const tz = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + q.y * tz - q.z * ty,
    y: v.y + q.w * ty + q.z * tx - q.x * tz,
    z: v.z + q.w * tz + q.x * ty - q.y * tx
  };
}
