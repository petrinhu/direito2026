import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { dimsRepouso, fatiasRepouso, razaoDoRepouso } from '@/core/piramide3d/geometria';
import { poseDeVoo, TG_V } from '@/core/piramide3d/voo';

/**
 * PONTA, enquadramento (QA de 17/11): em 1920 o ápice do topo sai da tela, por cima, e o topo fica
 * cortado. O voo final tem de mostrar a ponta inteira, com folga, em qualquer largura. Mede-se na
 * própria geometria do voo: a câmera é a de repouso (D = 9,7; elevação de 8 graus), e a posição de
 * cada ponto da tela sai do mesmo modelo de projeção da pose (escala u, distância dV).
 */
const D = 9.7;
const ELEVACAO = (8 * Math.PI) / 180;
const ALVO_Y = 1.5;
const topo = fatiasRepouso(7).map(dimsRepouso).at(-1)!;
const FOLGA_CONTROLES = 12;

/** Projeção fora de eixo da cena de voo (limitesDaProjecao de core/piramide3d/voo.ts): rc vira rv. */
function projetarNaTela(
  ponto: THREE.Vector3,
  rc: { x: number; y: number; w: number; h: number },
  rv: { x: number; y: number; w: number; h: number },
  camera: THREE.PerspectiveCamera
): { x: number; y: number } {
  const n = 0.05;
  const t0 = n * TG_V;
  const k = (2 * t0) / rc.h;
  const cx = rc.x - rv.x;
  const cy = rc.y - rv.y;
  const esq = (-t0 * rc.w) / rc.h - cx * k;
  const dir = esq + rv.w * k;
  const topo = t0 + cy * k;
  const base = topo - rv.h * k;
  const p = ponto.clone().sub(camera.position);
  const Dc = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const Uc = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const Rc = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const prof = p.dot(Dc);
  const xp = (p.dot(Rc) * n) / prof;
  const yp = (p.dot(Uc) * n) / prof;
  return { x: ((xp - esq) / (dir - esq)) * rv.w, y: ((topo - yp) / (topo - base)) * rv.h };
}

function cenasDaPose(largura: number, altura: number, ry = 0) {
  const camera = new THREE.PerspectiveCamera(26, 760 / 600, 0.05, 100);
  camera.position.set(0, ALVO_Y + D * Math.sin(ELEVACAO), D * Math.cos(ELEVACAO));
  camera.lookAt(0, ALVO_Y, 0);
  camera.updateMatrixWorld(true);
  const rc = { x: (largura - 760) / 2, y: ry, w: 760, h: 600 };
  const rv = { x: 0, y: 0, w: largura, h: altura };
  const v = poseDeVoo({
    camera,
    rc,
    rv,
    apxPedido: 0.4 * largura,
    razao: razaoDoRepouso(topo),
    D,
    alturaRelativa: topo.h / topo.LB
  });
  const Q = new THREE.Quaternion(v.Q.x, v.Q.y, v.Q.z, v.Q.w);
  const P = new THREE.Vector3(v.P.x, v.P.y, v.P.z);
  const apice = new THREE.Vector3(0, v.d.h / 2, v.d.PT / 2).applyQuaternion(Q).add(P);
  const centroFrente = new THREE.Vector3(0, 0, (v.d.PB + v.d.PT) / 4).applyQuaternion(Q).add(P);
  return { camera, rc, rv, v, apice, centroFrente, P };
}

function baseNaTela(largura: number, altura: number, ry = 0): { x: number; y: number } {
  const c = cenasDaPose(largura, altura, ry);
  const { v } = c;
  const q = new THREE.Quaternion(v.Q.x, v.Q.y, v.Q.z, v.Q.w);
  const ponto = new THREE.Vector3(0, -v.d.h / 2, v.d.PB / 2)
    .applyQuaternion(q)
    .add(new THREE.Vector3(v.P.x, v.P.y, v.P.z));
  return projetarNaTela(ponto, c.rc, c.rv, c.camera);
}

function apiceNaTela(largura: number, altura: number, ry = 0): { x: number; y: number } {
  const c = cenasDaPose(largura, altura, ry);
  return projetarNaTela(c.apice, c.rc, c.rv, c.camera);
}

describe('a ponta cabe na tela, sem subir sobre o bloco de botões acima da cena', () => {
  // Medido no DOM antes do voo: o bloco de botões termina 12 px acima do topo da cena (ry).
  for (const [w, h] of [
    [1280, 800],
    [1440, 900],
    [1920, 1080],
    [2560, 1440]
  ] as const) {
    it(`${w} por ${h}: o ápice fica abaixo do bloco de botões, com folga, e a base dentro da tela`, () => {
      for (const ry of [12, 100, 200, 300, Math.round(0.4 * h)]) {
        const a = apiceNaTela(w, h, ry);
        const b = baseNaTela(w, h, ry);
        const fimDoBloco = ry - FOLGA_CONTROLES;
        expect(a.y, `ápice sobre o bloco, ry=${ry}`).toBeGreaterThanOrEqual(fimDoBloco + 8);
        expect(a.y, `ápice fora da tela, ry=${ry}`).toBeGreaterThanOrEqual(0.05 * h);
        expect(b.y, `base fora da tela, ry=${ry}`).toBeLessThanOrEqual(0.95 * h);
        expect(a.x, `ry=${ry}`).toBeGreaterThanOrEqual(0);
        expect(a.x, `ry=${ry}`).toBeLessThanOrEqual(w);
      }
    });
  }
});
