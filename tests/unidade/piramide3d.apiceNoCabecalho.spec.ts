import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { dimsRepouso, fatiasRepouso, razaoDoRepouso } from '@/core/piramide3d/geometria';
import type { Retangulo } from '@/core/piramide3d/tipos';
import { poligonoDaPontaNaTela, poseDeVoo } from '@/core/piramide3d/voo';

/**
 * Ápice do voo abaixo do cabeçalho fixo (QA rodada 6, 17/11): com a cena alta na janela, o ápice subia
 * atrás da barra. A altura real do cabeçalho (injetada aqui) é a margem de cima do voo; o ápice fica
 * abaixo dela com a folga de 5% da altura da janela.
 */
const D = 9.7;
const ELEVACAO = (8 * Math.PI) / 180;
const ALVO_Y = 1.5;
const ponta = fatiasRepouso(5).map(dimsRepouso).at(-1)!;

const CASOS: readonly { w: number; h: number; cabecalho: number }[] = [
  { w: 1280, h: 800, cabecalho: 112 },
  { w: 1440, h: 900, cabecalho: 84 },
  { w: 1920, h: 1080, cabecalho: 84 },
  { w: 2560, h: 1440, cabecalho: 84 }
];

describe('PIR-QA: ápice do voo abaixo do cabeçalho fixo', () => {
  for (const { w, h, cabecalho } of CASOS) {
    it(`em ${w}x${h}, com cabeçalho de ${cabecalho} px, o ápice fica abaixo dele com folga de 5%`, () => {
      const camera = new THREE.PerspectiveCamera(26, 760 / 600, 0.05, 100);
      camera.position.set(0, ALVO_Y + D * Math.sin(ELEVACAO), D * Math.cos(ELEVACAO));
      camera.lookAt(0, ALVO_Y, 0);
      camera.updateMatrixWorld(true);
      // Cena alta na janela: sem a margem do cabeçalho, o ápice iria para cerca de 26 px.
      const rc: Retangulo = { x: (w - 760) / 2, y: 20, w: 760, h: 600 };
      const rv: Retangulo = { x: 0, y: 0, w, h };
      const pose = poseDeVoo({
        camera,
        rc,
        rv,
        apxPedido: 0.4 * w,
        razao: razaoDoRepouso(ponta),
        D,
        alturaRelativa: ponta.h / ponta.LB,
        margemSuperior: cabecalho
      });
      const poligono = poligonoDaPontaNaTela(pose, camera, rc, rv);
      const apice = Math.min(...poligono.map((p) => p.y));
      expect(apice).toBeGreaterThanOrEqual(cabecalho + 0.05 * h - 1);
    });
  }
});
