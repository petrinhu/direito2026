// Voo da fatia em primeiro plano: a projeção fora de eixo, a pose de voo e as curvas de animação.
// Funções de cálculo: nada aqui toca o DOM nem a biblioteca gráfica. Retângulos são {x, y, w, h}
// em px da janela. rc = cena, rv = canvas.
import { cantosTronco } from './geometria';
import type { DimensoesTronco, Ponto, Quaternio, Retangulo, Vetor3 } from './tipos';
import {
  EIXO_X,
  EIXO_Y,
  EIXO_Z,
  multiplicarQuaternios,
  negar,
  quaternioDeEixo,
  rotacionar,
  somar,
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

/** Faixa da largura da base da ponta, em alturas do canvas: a maior que não cruza os vizinhos. */
export const LARGURA_APICE_MINIMA = 0.64;
export const LARGURA_APICE_MAXIMA = 0.9;

/** Folga do ápice logo abaixo do fim do bloco de botões acima da cena (px). */
export const FOLGA_APICE_ACIMA_DA_CENA = 6;
/** Distância, em alturas do canvas, do ápice ao centro da face (medida no voo). */
export const DESLOCAMENTO_CENTRO_PONTA = 0.2;

/**
 * Deslocamento vertical do alvo da ponta, ancorado no topo da cena (rc): o ápice cai logo abaixo do
 * bloco de botões, e a base desce. Com a cena no meio da tela, isso é o mesmo que centralizar.
 */
export function deslocamentoVerticalDaPonta(rc: Retangulo, rv: Retangulo): number {
  const topoDaCena = rc.y - rv.y;
  const apice = Math.max(topoDaCena + FOLGA_APICE_ACIMA_DA_CENA, 0.07 * rv.h);
  const centro = apice + DESLOCAMENTO_CENTRO_PONTA * rv.h;
  return centro - (rc.y - rv.y + rc.h / 2);
}

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
  /** Altura sobre largura da base no repouso (h / LB). Só a ponta usa: mantém a proporção no voo. */
  readonly alturaRelativa?: number;
  /** Retângulos vizinhos da ponta, em px do canvas (selo, botões). A ponta não pode cruzá-los. */
  readonly obstaculos?: readonly Retangulo[];
  /** Altura real do cabeçalho fixo, em px do canvas: o ápice do voo fica abaixo dela (QA rodada 6). */
  readonly margemSuperior?: number;
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

/** Razão abaixo da qual a peça é a ponta da pirâmide (topo quase sem largura). */
const LIMITE_APICE = 0.05;

/** Pose de voo do tronco: dimensões, quatérnio e posição do centro do tronco, todos em mundo. */
function poseComDeslocamento(
  { camera, rc, rv, apxPedido, razao, D, alturaRelativa }: EntradaPoseDeVoo,
  oy: number,
  fracao: number
): PoseDeVoo {
  // Ponta: a base cabe em uma fração da altura do canvas (o ápice não pode sair da tela).
  const apice = razao < LIMITE_APICE && alturaRelativa !== undefined && alturaRelativa > 0;
  const lpx = apice
    ? Math.min(FRACAO_LARGURA_VOO * rv.w, fracao * rv.h)
    : FRACAO_LARGURA_VOO * rv.w;
  const apx = limitarApx(apxPedido, lpx, rv.h);
  const dV = DISTANCIA_VOO * D;
  const u = (2 * dV * TG_V) / rc.h;
  const ox = rv.w / 2 - (rc.x - rv.x + rc.w / 2);

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
  // Ponta: o apótema é o da proporção de repouso, sem o pedido da fatia (senão a face deixa de ter
  // a proporção da textura e o texto estica, o que aparece em 1920).
  const s = apice ? LB * Math.sqrt(alturaRelativa * alturaRelativa + 0.25) : apx * u;
  const delta = (LB - LT) / 2;
  const h = Math.sqrt(Math.max(0, s * s - delta * delta));
  const PB = PROPORCAO_PROFUNDIDADE * LB;
  const PT = apice ? PB * razao : PB - 2 * delta;
  const phi = Math.atan2(delta, h);

  const Qpsi = quaternioDeEixo(EIXO_Y, GIRO_PSI);
  const Qphi = quaternioDeEixo(EIXO_X, phi);
  const Qv = multiplicarQuaternios(multiplicarQuaternios(Qc, Qpsi), Qphi);
  const zc = (PT + PB) / 4;
  const Pv = subtrair(Pa, rotacionar({ x: 0, y: 0, z: zc }, Qv));

  return { d: { LB, LT, PB, PT, h }, Q: Qv, P: Pv, Pa, u, dV, apx };
}

/** Posição na tela (px do canvas) de um ponto do mundo, com a mesma projeção fora de eixo do voo. */
export function pontoNaTelaDoVoo(
  ponto: Vetor3,
  camera: PoseCamera,
  rc: Retangulo,
  rv: Retangulo
): { x: number; y: number } {
  const p = subtrair(ponto, camera.position);
  const Dc = rotacionar(negar(EIXO_Z), camera.quaternion);
  const Rc = rotacionar(EIXO_X, camera.quaternion);
  const Uc = rotacionar(EIXO_Y, camera.quaternion);
  const prof = p.x * Dc.x + p.y * Dc.y + p.z * Dc.z;
  const n = PLANO_PROXIMO;
  const L = limitesDaProjecao(rc, rv, n);
  const xp = ((p.x * Rc.x + p.y * Rc.y + p.z * Rc.z) * n) / prof;
  const yp = ((p.x * Uc.x + p.y * Uc.y + p.z * Uc.z) * n) / prof;
  return {
    x: ((xp - L.esq) / (L.dir - L.esq)) * rv.w,
    y: ((L.topo - yp) / (L.topo - L.base)) * rv.h
  };
}

function ehApice(entrada: EntradaPoseDeVoo): boolean {
  return (
    entrada.razao < LIMITE_APICE &&
    entrada.alturaRelativa !== undefined &&
    entrada.alturaRelativa > 0
  );
}

/**
 * Pose da ponta com a fração de largura dada. Para a ponta, o deslocamento vertical é corrigido em duas
 * iterações até o ápice cair no alvo (logo abaixo do bloco de botões acima da cena).
 */
export function poseDaPontaComFracao(entrada: EntradaPoseDeVoo, fracao: number): PoseDeVoo {
  const { camera, rc, rv } = entrada;
  const apice = ehApice(entrada);
  const padrao = apice ? deslocamentoVerticalDaPonta(rc, rv) : rv.h / 2 - (rc.y - rv.y + rc.h / 2);
  if (!apice) return poseComDeslocamento(entrada, padrao, fracao);
  const alvoApice = Math.max(
    rc.y - rv.y + FOLGA_APICE_ACIMA_DA_CENA,
    (entrada.margemSuperior ?? 0) + FOLGA_TOPO_FRACAO * rv.h,
    0.07 * rv.h
  );
  let oy = padrao;
  for (let i = 0; i < 4; i++) {
    const v = poseComDeslocamento(entrada, oy, fracao);
    // O ápice é o ponto mais alto do contorno projetado (os 8 cantos do tronco).
    const y = Math.min(...poligonoDaPontaNaTela(v, camera, rc, rv).map((p) => p.y));
    oy += alvoApice - y;
  }
  return poseComDeslocamento(entrada, oy, fracao);
}

/** Folga do ápice abaixo do cabeçalho fixo, em fração da altura da janela (a folga de 5% do voo). */
export const FOLGA_TOPO_FRACAO = 0.05;

/** Folga, em px, que a ponta mantém de cada vizinho (encostar no canto não basta). */
export const FOLGA_VIZINHO = 8;

/** Retângulo aumentado em `folga` px para cada lado. */
export function inflarRetangulo(r: Retangulo, folga: number): Retangulo {
  return { x: r.x - folga, y: r.y - folga, w: r.w + 2 * folga, h: r.h + 2 * folga };
}

/** Maior fração da ponta, entre a mínima e a máxima, que não cruza nenhum vizinho (busca binária). */
export function fracaoDaPonta(entrada: EntradaPoseDeVoo, vizinhos: readonly Retangulo[]): number {
  if (!ehApice(entrada) || vizinhos.length === 0) return LARGURA_APICE_MAXIMA;
  const area = vizinhos.map((v) => inflarRetangulo(v, FOLGA_VIZINHO));
  const livre = (fracao: number): boolean => {
    const poligono = poligonoDaPontaNaTela(
      poseDaPontaComFracao(entrada, fracao),
      entrada.camera,
      entrada.rc,
      entrada.rv
    );
    return !area.some((v) => cruzaRetangulo(poligono, v));
  };
  if (livre(LARGURA_APICE_MAXIMA)) return LARGURA_APICE_MAXIMA;
  if (!livre(LARGURA_APICE_MINIMA)) return LARGURA_APICE_MINIMA;
  let baixo = LARGURA_APICE_MINIMA;
  let alto = LARGURA_APICE_MAXIMA;
  for (let i = 0; i < 14; i++) {
    const meio = (baixo + alto) / 2;
    if (livre(meio)) baixo = meio;
    else alto = meio;
  }
  return baixo;
}

/** Pose de voo: a ponta usa a maior fração que não cruza os vizinhos; as demais peças, a pose comum. */
export function poseDeVoo(entrada: EntradaPoseDeVoo): PoseDeVoo {
  return poseDaPontaComFracao(entrada, fracaoDaPonta(entrada, entrada.obstaculos ?? []));
}

/** Contorno da ponta na tela: a envoltória convexa dos 8 cantos do tronco, projetados. */
export function poligonoDaPontaNaTela(
  pose: PoseDeVoo,
  camera: PoseCamera,
  rc: Retangulo,
  rv: Retangulo
): Ponto[] {
  const projetados = cantosTronco(pose.d).map((c) =>
    pontoNaTelaDoVoo(
      somar(pose.P, rotacionar({ x: c[0], y: c[1], z: c[2] }, pose.Q)),
      camera,
      rc,
      rv
    )
  );
  return envoltoriaConvexa(projetados);
}

/** Envoltória convexa (cadeia monótona de Andrew). */
function envoltoriaConvexa(pontos: readonly Ponto[]): Ponto[] {
  const ordenados = [...pontos].sort((a, b) => a.x - b.x || a.y - b.y);
  const cruz = (o: Ponto, a: Ponto, b: Ponto): number =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const inferior: Ponto[] = [];
  for (const p of ordenados) {
    while (
      inferior.length >= 2 &&
      cruz(inferior[inferior.length - 2]!, inferior[inferior.length - 1]!, p) <= 0
    )
      inferior.pop();
    inferior.push(p);
  }
  const superior: Ponto[] = [];
  for (const p of [...ordenados].reverse()) {
    while (
      superior.length >= 2 &&
      cruz(superior[superior.length - 2]!, superior[superior.length - 1]!, p) <= 0
    )
      superior.pop();
    superior.push(p);
  }
  return [...inferior.slice(0, -1), ...superior.slice(0, -1)];
}

/** Separação de eixos (SAT): true se o polígono convexo e o retângulo se sobrepõem (encostar não conta). */
export function cruzaRetangulo(poligono: readonly Ponto[], r: Retangulo): boolean {
  const caixa: Ponto[] = [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h }
  ];
  const eixos: Ponto[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 }
  ];
  for (const forma of [poligono, caixa]) {
    for (let i = 0; i < forma.length; i++) {
      const a = forma[i]!;
      const b = forma[(i + 1) % forma.length]!;
      eixos.push({ x: -(b.y - a.y), y: b.x - a.x });
    }
  }
  for (const e of eixos) {
    const [minP, maxP] = faixaSobre(poligono, e);
    const [minQ, maxQ] = faixaSobre(caixa, e);
    if (maxP < minQ || maxQ < minP) return false;
  }
  return true;
}

function faixaSobre(pontos: readonly Ponto[], eixo: Ponto): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const p of pontos) {
    const s = p.x * eixo.x + p.y * eixo.y;
    if (s < min) min = s;
    if (s > max) max = s;
  }
  return [min, max];
}
