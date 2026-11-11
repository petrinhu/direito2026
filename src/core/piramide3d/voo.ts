// Voo da fatia em primeiro plano: a projeção fora de eixo, a pose de voo e as curvas de animação.
// Funções de cálculo: nada aqui toca o DOM nem a biblioteca gráfica. Retângulos são {x, y, w, h}
// em px da janela. rc = cena, rv = canvas.
import type { DimensoesTronco, Quaternio, Retangulo, Vetor3 } from './tipos';
import {
  EIXO_X,
  EIXO_Y,
  EIXO_Z,
  multiplicarQuaternios,
  negar,
  quaternioDeEixo,
  rotacionar,
  somarEscalado,
  subtrair
} from './vetores';

/** Metade do FOV vertical da cena (26 graus). */
export const TG_V = Math.tan((13 * Math.PI) / 180);
export const PLANO_PROXIMO = 0.05;
export const PLANO_DISTANTE = 100;
/** A face ocupa 80% da largura da janela. */
export const FRACAO_LARGURA_VOO = 0.8;
/** A face cabe em 84% da altura da janela. */
export const FRACAO_ALTURA_FACE = 0.84;
/** A face para a 30% da distância da câmera. */
export const DISTANCIA_VOO = 0.3;
/** 1 grau de sobra; mais que isso entorta as linhas do texto. */
export const GIRO_PSI = 0.02;
/** Profundidade da pedra em voo, em fração da base. */
export const PROPORCAO_PROFUNDIDADE = 0.2;

export interface LimitesDaProjecao {
  readonly esq: number;
  readonly dir: number;
  readonly topo: number;
  readonly base: number;
}

/**
 * Limites do plano próximo da projeção fora de eixo: a cena mantém a mesma imagem de antes, mesmo
 * que o canvas vire a janela inteira. Em repouso (rc == rv) dá a projeção simétrica comum.
 */
export function limitesDaProjecao(
  rc: Retangulo,
  rv: Retangulo,
  n: number = PLANO_PROXIMO
): LimitesDaProjecao {
  const cx = rc.x - rv.x;
  const cy = rc.y - rv.y;
  const t0 = n * TG_V;
  const k = (2 * t0) / rc.h;
  const esq = (-t0 * rc.w) / rc.h - cx * k;
  const dir = esq + rv.w * k;
  const topo = t0 + cy * k;
  const base = topo - rv.h * k;
  return { esq, dir, topo, base };
}

export function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

export function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

/** Tamanho pedido para a face em voo, em px, dentro dos limites do plano. */
export function limitarApx(apxPedido: number, lpx: number, vh: number): number {
  return Math.min(Math.max(apxPedido, 0.2 * lpx), FRACAO_ALTURA_FACE * vh);
}

/** Posição e orientação da câmera, sem a biblioteca gráfica. */
export interface PoseCamera {
  readonly position: Vetor3;
  readonly quaternion: Quaternio;
}

export interface EntradaPoseDeVoo {
  readonly camera: PoseCamera;
  readonly rc: Retangulo;
  readonly rv: Retangulo;
  readonly apxPedido: number;
  /** 0,84 para a fatia, 1,0 para o bloco. */
  readonly razao: number;
  readonly D: number;
}

export interface PoseDeVoo {
  readonly d: DimensoesTronco;
  readonly Q: Quaternio;
  readonly P: Vetor3;
  readonly Pa: Vetor3;
  readonly u: number;
  readonly dV: number;
  readonly apx: number;
}

/** Pose de voo do tronco: dimensões, quatérnio e posição do centro do tronco, todos em mundo. */
export function poseDeVoo({ camera, rc, rv, apxPedido, razao, D }: EntradaPoseDeVoo): PoseDeVoo {
  const lpx = FRACAO_LARGURA_VOO * rv.w;
  const apx = limitarApx(apxPedido, lpx, rv.h);
  const dV = DISTANCIA_VOO * D;
  const u = (2 * dV * TG_V) / rc.h;
  const ox = rv.w / 2 - (rc.x - rv.x + rc.w / 2);
  const oy = rv.h / 2 - (rc.y - rv.y + rc.h / 2);

  const Qc = camera.quaternion;
  const Dc = rotacionar(negar(EIXO_Z), Qc);
  const Rc = rotacionar(EIXO_X, Qc);
  const Uc = rotacionar(EIXO_Y, Qc);
  const Pa = somarEscalado(
    somarEscalado(somarEscalado(camera.position, Dc, dV), Rc, ox * u),
    Uc,
    -oy * u
  );

  const LB = lpx * u;
  const LT = razao * LB;
  const s = apx * u;
  const delta = (LB - LT) / 2;
  const h = Math.sqrt(Math.max(0, s * s - delta * delta));
  const PB = PROPORCAO_PROFUNDIDADE * LB;
  const PT = PB - 2 * delta;
  const phi = Math.atan2(delta, h);

  const Qpsi = quaternioDeEixo(EIXO_Y, GIRO_PSI);
  const Qphi = quaternioDeEixo(EIXO_X, phi);
  const Qv = multiplicarQuaternios(multiplicarQuaternios(Qc, Qpsi), Qphi);
  const zc = (PT + PB) / 4;
  const Pv = subtrair(Pa, rotacionar({ x: 0, y: 0, z: zc }, Qv));

  return { d: { LB, LT, PB, PT, h }, Q: Qv, P: Pv, Pa, u, dV, apx };
}
