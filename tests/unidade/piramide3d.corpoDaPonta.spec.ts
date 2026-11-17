import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  cantosTronco,
  dimsRepouso,
  fatiasRepouso,
  razaoDoRepouso
} from '@/core/piramide3d/geometria';
import type { Medidor } from '@/core/piramide3d/layoutFace';
import { layoutDaPonta } from '@/core/piramide3d/layoutPonta';
import { FRACAO_LARGURA_VOO, poseDeVoo, pontoNaTelaDoVoo } from '@/core/piramide3d/voo';

/**
 * PIR-PONTA, legibilidade (QA, 17/11): o corpo do texto da ponta no voo tem de ter pelo menos 12 px
 * na tela, em 1280, 1440, 1920 e 2560. Mede-se pela cadeia real: o tamanho escolhido para o corpo na
 * textura (layoutDaPonta, com o teto levantado) vezes a escala da face na tela (largura da base
 * projetada / largura da textura). Medidor fake (0,55 da fonte por caractere): a medida real do
 * navegador está em ponta/medida-fonte.md.
 */
const D = 9.7;
const ELEVACAO = (8 * Math.PI) / 180;
const ALVO_Y = 1.5;
const MINIMO_CORPO_TELA = 12;
const ponta = fatiasRepouso(5).map(dimsRepouso).at(-1)!;
const medidor: Medidor = {
  definirFonte(fonte) {
    const m = /(\d+(?:\.\d+)?)px/.exec(fonte);
    this.tamanho = m ? Number(m[1]) : 16;
  },
  largura(texto) {
    return texto.length * (this.tamanho ?? 16) * 0.55;
  }
} as Medidor & { tamanho?: number };

const info = {
  nivel: 'constituicao-positiva',
  nome: 'Texto de teste da ponta, linha um, com p',
  rotulo: 'Texto de teste da ponta, linha um, com p',
  explicacao:
    'Texto de teste da ponta, linha um, com palavras comuns para medir o layout. Texto de teste da ponta, linha um, com palavras comuns para medir o layout. Texto de teste da ponta, linha um, com palavras comuns para medir o layout. Texto de teste da ponta, linha um, com palavras comuns para ',
  exemplo:
    'Texto de teste da ponta, linha um, com palavras comuns para medir o layout. Texto de teste da ponta, linha um, com palavras comuns para medir o layout. '
};

const fontes = {
  nome: (f: number) => `700 ${f * 1.5}px "Cormorant Garamond"`,
  corpo: (f: number) => `400 ${f}px "Inter"`,
  rotulo: (f: number) => `700 ${f * 1.1}px "Cormorant Garamond"`
};

function corpoNaTela(largura: number, altura: number): number {
  const camera = new THREE.PerspectiveCamera(26, 760 / 600, 0.05, 100);
  camera.position.set(0, ALVO_Y + D * Math.sin(ELEVACAO), D * Math.cos(ELEVACAO));
  camera.lookAt(0, ALVO_Y, 0);
  camera.updateMatrixWorld(true);
  const rc = { x: (largura - 760) / 2, y: Math.round(altura * 0.3), w: 760, h: 600 };
  const rv = { x: 0, y: 0, w: largura, h: altura };
  const a = ponta.h / ponta.LB;
  const v = poseDeVoo({
    camera,
    rc,
    rv,
    apxPedido: 0.4 * largura,
    razao: razaoDoRepouso(ponta),
    D,
    alturaRelativa: a
  });
  // A textura da face é pintada com a largura do voo (FRACAO_LARGURA_VOO da janela), não com a da face na tela.
  const Lpx = Math.round(FRACAO_LARGURA_VOO * largura);
  const layout = layoutDaPonta(
    medidor,
    { nome: info.nome, explicacao: info.explicacao, rotulo: info.rotulo, exemplo: info.exemplo },
    { W: Lpx, H: Lpx * a },
    fontes,
    { fInicial: Lpx / 12, fMinimo: 12, margem: 8 }
  );
  if (!layout) return 0;
  const Q = new THREE.Quaternion(v.Q.x, v.Q.y, v.Q.z, v.Q.w);
  const P = new THREE.Vector3(v.P.x, v.P.y, v.P.z);
  const base = cantosTronco(v.d)
    .slice(0, 2)
    .map((c) => new THREE.Vector3(...c).applyQuaternion(Q).add(P))
    .map((p) => pontoNaTelaDoVoo(p, camera, rc, rv).x);
  const [esq, dir] = base as [number, number];
  const larguraNaTela = Math.abs(dir - esq);
  return (layout.f * larguraNaTela) / Lpx;
}

describe('PIR-PONTA: corpo do texto da ponta legível no voo', () => {
  for (const [w, h] of [
    [1280, 800],
    [1440, 900],
    [1920, 1080],
    [2560, 1440]
  ] as const) {
    it(`em ${w}px de largura, o corpo tem pelo menos ${MINIMO_CORPO_TELA} px na tela`, () => {
      expect(corpoNaTela(w, h)).toBeGreaterThanOrEqual(MINIMO_CORPO_TELA);
    });
  }
});
