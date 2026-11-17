import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { dimsRepouso, fatiasRepouso, razaoDoRepouso } from '@/core/piramide3d/geometria';
import type { Retangulo } from '@/core/piramide3d/tipos';
import {
  cruzaRetangulo,
  FOLGA_VIZINHO,
  inflarRetangulo,
  EntradaPoseDeVoo,
  fracaoDaPonta,
  poligonoDaPontaNaTela,
  poseDaPontaComFracao,
  poseDeVoo
} from '@/core/piramide3d/voo';

/**
 * PIR-PONTA, vizinhos (QA rodada 3, 17/11): a face da ponta não pode cobrir o selo "7 dias" nem o bloco
 * de botões acima da cena. A fração da ponta é a maior entre 0,64 e 0,9 que ainda não cruza nenhum
 * vizinho. Retângulos medidos no Firefox 160, durante o voo, com a rolagem centrada na cena (17/11/2026).
 * O cabeçalho fica recolhido durante o voo (fora do alcance) e o botão Home do canto não cruza a ponta.
 */
const D = 9.7;
const ELEVACAO = (8 * Math.PI) / 180;
const ALVO_Y = 1.5;
const ponta = fatiasRepouso(5).map(dimsRepouso).at(-1)!;

interface CasoReal {
  readonly largura: number;
  readonly rv: Retangulo;
  readonly rc: Retangulo;
  readonly vizinhos: readonly Retangulo[];
}

const CASOS: readonly CasoReal[] = [
  {
    largura: 1280,
    rv: { x: 0, y: 0, w: 1268, h: 800 },
    rc: { x: 394, y: 158, w: 760, h: 600 },
    vizinhos: [
      { x: 394, y: 100, w: 760, h: 46 },
      { x: 900, y: 511, w: 352, h: 175 }
    ]
  },
  {
    largura: 1440,
    rv: { x: 0, y: 0, w: 1428, h: 900 },
    rc: { x: 474, y: 208, w: 760, h: 600 },
    vizinhos: [
      { x: 474, y: 150, w: 760, h: 46 },
      { x: 1060, y: 611, w: 352, h: 175 }
    ]
  },
  {
    largura: 1920,
    rv: { x: 0, y: 0, w: 1908, h: 1080 },
    rc: { x: 714, y: 298, w: 760, h: 600 },
    vizinhos: [
      { x: 714, y: 240, w: 760, h: 46 },
      { x: 1540, y: 791, w: 352, h: 175 }
    ]
  },
  {
    largura: 2560,
    rv: { x: 0, y: 0, w: 2548, h: 1440 },
    rc: { x: 1034, y: 478, w: 760, h: 600 },
    vizinhos: [
      { x: 1034, y: 420, w: 760, h: 46 },
      { x: 2180, y: 1151, w: 352, h: 175 }
    ]
  }
];

function entradaDo(caso: CasoReal): EntradaPoseDeVoo {
  const camera = new THREE.PerspectiveCamera(26, 760 / 600, 0.05, 100);
  camera.position.set(0, ALVO_Y + D * Math.sin(ELEVACAO), D * Math.cos(ELEVACAO));
  camera.lookAt(0, ALVO_Y, 0);
  camera.updateMatrixWorld(true);
  return {
    camera,
    rc: caso.rc,
    rv: caso.rv,
    apxPedido: 0.4 * caso.largura,
    razao: razaoDoRepouso(ponta),
    D,
    alturaRelativa: ponta.h / ponta.LB
  };
}

describe('PIR-PONTA: a ponta não cruza os vizinhos no voo', () => {
  for (const caso of CASOS) {
    describe(`${caso.largura} px`, () => {
      const entrada = entradaDo(caso);

      it('a fração escolhida fica entre 0,64 e 0,9', () => {
        const f = fracaoDaPonta(entrada, caso.vizinhos);
        expect(f).toBeGreaterThanOrEqual(0.64);
        expect(f).toBeLessThanOrEqual(0.9);
      });

      it('na fração escolhida, a ponta não cruza nenhum vizinho', () => {
        const f = fracaoDaPonta(entrada, caso.vizinhos);
        const pose = poseDaPontaComFracao(entrada, f);
        const poligono = poligonoDaPontaNaTela(pose, entrada.camera, caso.rc, caso.rv);
        for (const vizinho of caso.vizinhos) {
          expect(cruzaRetangulo(poligono, inflarRetangulo(vizinho, FOLGA_VIZINHO))).toBe(false);
        }
      });

      it('é a maior: um pouco acima dessa fração, a ponta cruza algum vizinho', () => {
        const f = fracaoDaPonta(entrada, caso.vizinhos);
        if (f >= 0.9) return;
        const pose = poseDaPontaComFracao(entrada, f + 0.01);
        const poligono = poligonoDaPontaNaTela(pose, entrada.camera, caso.rc, caso.rv);
        expect(
          caso.vizinhos.some((v) => cruzaRetangulo(poligono, inflarRetangulo(v, FOLGA_VIZINHO)))
        ).toBe(true);
      });

      it('poseDeVoo com os vizinhos usa essa mesma fração', () => {
        const f = fracaoDaPonta(entrada, caso.vizinhos);
        const comVizinhos = poseDeVoo({ ...entrada, obstaculos: caso.vizinhos });
        const esperada = poseDaPontaComFracao(entrada, f);
        expect(comVizinhos.d.LB).toBeCloseTo(esperada.d.LB, 9);
      });
    });
  }
});
