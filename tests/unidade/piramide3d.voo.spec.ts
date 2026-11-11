import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  FRACAO_ALTURA_FACE,
  FRACAO_LARGURA_VOO,
  PLANO_DISTANTE,
  PLANO_PROXIMO,
  easeInOutCubic,
  easeOutCubic,
  limitarApx,
  limitesDaProjecao,
  poseDeVoo
} from '@/core/piramide3d/voo';
import {
  EIXO_X,
  EIXO_Y,
  EIXO_Z,
  multiplicarQuaternios,
  quaternioDeEixo,
  rotacionar
} from '@/core/piramide3d/vetores';

/** Gerador determinístico, para os casos aleatórios não mudarem de uma rodada para outra. */
function sorteador(semente: number): () => number {
  let s = semente >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A mesma câmera da cena: 26 graus, a 9,7 de distância do centro da pirâmide, 8 graus acima. */
function camaraDaCena(): THREE.PerspectiveCamera {
  const D = 9.7;
  const elevacao = (8 * Math.PI) / 180;
  const c = new THREE.PerspectiveCamera(26, 1, PLANO_PROXIMO, PLANO_DISTANTE);
  c.position.set(0, 1.5 + D * Math.sin(elevacao), D * Math.cos(elevacao));
  c.lookAt(0, 1.5, 0);
  c.updateMatrixWorld(true);
  return c;
}

function aplicarLimites(
  camera: THREE.PerspectiveCamera,
  rc: { x: number; y: number; w: number; h: number },
  rv: { x: number; y: number; w: number; h: number }
): void {
  const l = limitesDaProjecao(rc, rv);
  camera.projectionMatrix.makePerspective(
    l.esq,
    l.dir,
    l.topo,
    l.base,
    PLANO_PROXIMO,
    PLANO_DISTANTE
  );
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}

describe('vetores e quatérnios do core, conferidos contra a biblioteca gráfica', () => {
  it('rotacionar, multiplicar e quaternioDeEixo dão o mesmo que three, em 200 casos', () => {
    const rnd = sorteador(42);
    for (let i = 0; i < 200; i++) {
      const eixos = [EIXO_X, EIXO_Y, EIXO_Z];
      const ea = eixos[Math.floor(rnd() * 3)] as typeof EIXO_X;
      const eb = eixos[Math.floor(rnd() * 3)] as typeof EIXO_X;
      const ang1 = (rnd() - 0.5) * 6;
      const ang2 = (rnd() - 0.5) * 6;
      const v = { x: rnd() * 4 - 2, y: rnd() * 4 - 2, z: rnd() * 4 - 2 };

      const qa = quaternioDeEixo(ea, ang1);
      const qb = quaternioDeEixo(eb, ang2);
      const q = multiplicarQuaternios(qa, qb);
      const r = rotacionar(v, q);

      const ta = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(ea.x, ea.y, ea.z), ang1);
      const tb = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(eb.x, eb.y, eb.z), ang2);
      const tq = ta.clone().multiply(tb);
      const tr = new THREE.Vector3(v.x, v.y, v.z).applyQuaternion(tq);

      expect(q.x).toBeCloseTo(tq.x, 12);
      expect(q.y).toBeCloseTo(tq.y, 12);
      expect(q.z).toBeCloseTo(tq.z, 12);
      expect(q.w).toBeCloseTo(tq.w, 12);
      expect(r.x).toBeCloseTo(tr.x, 12);
      expect(r.y).toBeCloseTo(tr.y, 12);
      expect(r.z).toBeCloseTo(tr.z, 12);
    }
  });
});

describe('projeção fora de eixo', () => {
  it('em repouso (cena igual ao canvas) é a projeção simétrica comum de 26 graus', () => {
    const camera = camaraDaCena();
    aplicarLimites(camera, { x: 0, y: 0, w: 760, h: 600 }, { x: 0, y: 0, w: 760, h: 600 });
    const simetrica = new THREE.PerspectiveCamera(26, 760 / 600, PLANO_PROXIMO, PLANO_DISTANTE);
    const obtida = camera.projectionMatrix.elements;
    const esperada = simetrica.projectionMatrix.elements;
    for (let i = 0; i < 16; i++) expect(obtida[i]).toBeCloseTo(esperada[i] as number, 9);
  });

  it('com o canvas em tela cheia, a cena mostra a mesma imagem de antes, deslocada só pelo recorte', () => {
    const rep = camaraDaCena();
    const voo = camaraDaCena();
    const rc = { x: 230, y: 310, w: 760, h: 600 };
    aplicarLimites(rep, { x: 0, y: 0, w: rc.w, h: rc.h }, { x: 0, y: 0, w: rc.w, h: rc.h });
    aplicarLimites(voo, rc, { x: 0, y: 0, w: 1920, h: 1080 });
    const ponto = new THREE.Vector3(0.4, 0.9, 0.2);
    const a = ponto.clone().project(rep);
    const b = ponto.clone().project(voo);
    // px na cena (repouso) e px na janela (voo): a diferença é o canto da cena na janela.
    const pxRepX = ((a.x + 1) / 2) * rc.w;
    const pxRepY = ((1 - a.y) / 2) * rc.h;
    const pxVooX = ((b.x + 1) / 2) * 1920;
    const pxVooY = ((1 - b.y) / 2) * 1080;
    expect(pxVooX - pxRepX).toBeCloseTo(rc.x, 6);
    expect(pxVooY - pxRepY).toBeCloseTo(rc.y, 6);
  });
});

describe('pose de voo', () => {
  const rc = { x: 230, y: 310, w: 760, h: 600 };
  const rv = { x: 0, y: 0, w: 1920, h: 1080 };

  function projetarPx(camera: THREE.PerspectiveCamera, v: THREE.Vector3): { x: number; y: number } {
    const p = v.clone().project(camera);
    return { x: ((p.x + 1) / 2) * rv.w, y: ((1 - p.y) / 2) * rv.h };
  }

  function poseParaThree(razao: number) {
    const camera = camaraDaCena();
    aplicarLimites(camera, rc, rv);
    const pose = poseDeVoo({
      camera: {
        position: camera.position,
        quaternion: camera.quaternion
      },
      rc,
      rv,
      apxPedido: 700,
      razao,
      D: 9.7
    });
    const Q = new THREE.Quaternion(pose.Q.x, pose.Q.y, pose.Q.z, pose.Q.w);
    const P = new THREE.Vector3(pose.P.x, pose.P.y, pose.P.z);
    return { camera, pose, Q, P };
  }

  it('o centro da face cai no centro da janela, e a base da face ocupa 80% da largura', () => {
    const { camera, pose, Q, P } = poseParaThree(0.84);
    const zc = (pose.d.PT + pose.d.PB) / 4;
    const centro = new THREE.Vector3(0, 0, zc).applyQuaternion(Q).add(P);
    const c = projetarPx(camera, centro);
    expect(c.x).toBeCloseTo(rv.w / 2, 3);
    expect(c.y).toBeCloseTo(rv.h / 2, 3);

    const local = (x: number, y: number, z: number) =>
      new THREE.Vector3(x, y, z).applyQuaternion(Q).add(P);
    const esq = projetarPx(camera, local(-pose.d.LB / 2, -pose.d.h / 2, pose.d.PB / 2));
    const dir = projetarPx(camera, local(pose.d.LB / 2, -pose.d.h / 2, pose.d.PB / 2));
    expect((dir.x - esq.x) / rv.w).toBeCloseTo(FRACAO_LARGURA_VOO, 2);
  });

  it('a altura da face é a pedida (a face em voo mede o que o leiaute do texto pediu)', () => {
    const { camera, pose, Q, P } = poseParaThree(1);
    const local = (x: number, y: number, z: number) =>
      new THREE.Vector3(x, y, z).applyQuaternion(Q).add(P);
    const base = projetarPx(camera, local(0, -pose.d.h / 2, pose.d.PB / 2));
    const topo = projetarPx(camera, local(0, pose.d.h / 2, pose.d.PT / 2));
    expect(Math.abs(base.y - topo.y)).toBeCloseTo(700, 0);
    expect(pose.apx).toBe(700);
  });

  it('a face de razão 1 (norma fundamental) tem topo e base de mesma largura', () => {
    const { pose } = poseParaThree(1);
    expect(pose.d.LT).toBeCloseTo(pose.d.LB, 12);
    expect(pose.d.PT).toBeCloseTo(pose.d.PB, 12);
  });

  it('o tamanho pedido fica entre 20% da largura da face e 84% da altura da janela', () => {
    const lpx = FRACAO_LARGURA_VOO * rv.w;
    expect(limitarApx(10, lpx, rv.h)).toBeCloseTo(0.2 * lpx, 9);
    expect(limitarApx(99999, lpx, rv.h)).toBeCloseTo(FRACAO_ALTURA_FACE * rv.h, 9);
    expect(limitarApx(500, lpx, rv.h)).toBe(500);
  });
});

describe('curvas de animação', () => {
  it('easeInOutCubic: 0, 0,5 e 1 nos pontos conhecidos, crescente', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 12);
    expect(easeInOutCubic(1)).toBeCloseTo(1, 12);
    let anterior = -1;
    for (let p = 0; p <= 1; p += 0.05) {
      const v = easeInOutCubic(p);
      expect(v).toBeGreaterThan(anterior);
      anterior = v;
    }
  });

  it('easeOutCubic: parte de 0, chega a 1 e anda mais rápido no começo', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.25)).toBeGreaterThan(0.25);
  });
});
