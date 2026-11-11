/* global DOMRect, performance */
// Cena 3D da figura: a pirâmide em fatias, os blocos da norma fundamental, as setas, as partículas
// e o voo da fatia em primeiro plano. Única parte do site que usa a biblioteca gráfica (three);
// os cálculos puros (geometria, projeção, pose de voo, leiaute do texto) vêm de src/core.
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ALTURA,
  FRACAO_ALTURA_FACE,
  FRACAO_LARGURA_VOO,
  GIRO,
  PLANO_DISTANTE,
  PLANO_PROXIMO,
  TG_V,
  arestasTronco,
  blocosNorma,
  cantosFaceFrente,
  cantosTronco,
  dimsRepouso,
  easeInOutCubic,
  easeOutCubic,
  escalaDaTextura,
  fatiasRepouso,
  fonteCorpo,
  fonteNome,
  limitesDaProjecao,
  poseDeVoo,
  posicoesTronco
} from '@/app/piramide3d/nucleo';
import type { LeiauteFace } from '@/core/piramide3d/layoutFace';
import type { PerfilFigura } from '@/core/piramide3d/perfil';
import type { DimensoesTronco, NivelFigura3d, Ponto, Retangulo } from '@/core/piramide3d/tipos';
import { medidorDoCanvas, pintarFace, type CoresDaFace } from './faceTexto';

const FOV_V = 26;
const D = 9.7; // distância da câmera ao centro da pirâmide
const ELEVACAO = (8 * Math.PI) / 180;
const ALVO_Y = 1.5;
const FRACAO_CENTRO = 0.46; // centro da pirâmide em 46% da largura da cena
const RECUO_FORA = 1.2; // os outros níveis recuam
const OPAC_FORA = 0.1;
const RAZAO_FATIA = 0.84;
const RAZAO_BLOCO = 1.0;
const DUR_IDA = 1050;
const DUR_IDA_NORMA = 1400;
// Efeito da norma fundamental: segundos para subir a 1 ou descer a 0.
const DUR_EFEITO = 0.35;
const RAIOS = 12;
const VELOCIDADE_CONTORNO = 0.05; // unidades de mundo por segundo: o traço anda devagar
const CONSTITUICAO = 'constituicao-positiva';
const NORMA_FUNDAMENTAL = 'norma-fundamental';
const DUR_VOLTA = 650;
const ESPERA_TEXTURA_MS = 200; // a janela precisa ficar parada este tempo antes de repintar a face
const INICIO_TEXTO = 0.65; // fração do voo em que o texto começa a aparecer
const FIM_TEXTO = 0.95;
const DUR_INTRO = 900;
const PARTICULAS = 520;
const ROTACAO_GIRO = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), GIRO);

/** Cores do desenho, lidas das variáveis CSS da figura. */
export interface Paleta {
  readonly fundo: THREE.Color;
  readonly texto: THREE.Color;
  readonly ouro: THREE.Color;
  readonly ouroLuz: THREE.Color;
  readonly petroleo: THREE.Color;
  readonly areia: THREE.Color;
  readonly sombra: THREE.Color;
  readonly faceCores: CoresDaFace;
}

export interface OpcoesCena {
  readonly canvas: HTMLCanvasElement;
  readonly cenaEl: HTMLElement;
  readonly perfil: PerfilFigura;
  readonly paleta: Paleta;
  readonly escuro: boolean;
  readonly reduzido: boolean;
  readonly textos: ReadonlyMap<string, NivelFigura3d>;
}

export interface ProjecaoRotulo {
  readonly x: number;
  readonly y: number;
}

export interface FrenteRepouso {
  readonly poligono: Ponto[];
  readonly profundidade: number;
}

export interface Cena {
  setAtivo(nivel: string | null): void;
  animar(agora: number, dt: number): boolean;
  render(): void;
  redimensionar(dpr: number): void;
  opacidadeRotulos(): number;
  projetar(chave: string): ProjecaoRotulo;
  silhuetas(): Map<string, Ponto[]>;
  frentes(): Map<string, FrenteRepouso>;
  poligonoFinal(nivel: string): Ponto[] | null;
  dispose(): void;
}

function rng(semente: number): () => number {
  let s = semente >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Pele = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;

// Pele da face da frente: quadrilátero de 2 triângulos, sem luz, com a textura do texto.
// Coordenadas de textura: base esquerda, base direita, topo direito, topo esquerdo.
function geometriaPele(razao: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
  g.setAttribute(
    'uv',
    new THREE.BufferAttribute(
      new Float32Array([0, 0, 1, 0, 0.5 + razao / 2, 1, 0.5 - razao / 2, 1]),
      2
    )
  );
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

function posicionarPele(pele: Pele, dims: DimensoesTronco): void {
  const posicao = pele.geometry.getAttribute('position') as THREE.BufferAttribute;
  cantosFaceFrente(dims).forEach((c, i) => posicao.array.set(c, i * 3));
  posicao.needsUpdate = true;
}

function lerpDims(a: DimensoesTronco, b: DimensoesTronco, e: number): DimensoesTronco {
  return {
    LB: a.LB + (b.LB - a.LB) * e,
    LT: a.LT + (b.LT - a.LT) * e,
    PB: a.PB + (b.PB - a.PB) * e,
    PT: a.PT + (b.PT - a.PT) * e,
    h: a.h + (b.h - a.h) * e
  };
}

function texturaRadial(cor: THREE.Color): THREE.CanvasTexture {
  const tela = document.createElement('canvas');
  tela.width = 256;
  tela.height = 256;
  const x = tela.getContext('2d');
  if (!x) throw new Error('canvas 2D indisponível para o halo');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  const rgb = cor.getStyle();
  g.addColorStop(0, rgb);
  g.addColorStop(0.4, rgb);
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Deslocamento em x da pirâmide para o centro dela cair em FRACAO_CENTRO da largura da cena.
function deslocamentoX(cw: number, ch: number): number {
  const larguraVisivel = 2 * D * TG_V * (cw / ch);
  return (FRACAO_CENTRO - 0.5) * larguraVisivel;
}

function aplicarPontos(
  cores: THREE.TypedArray,
  cBase: THREE.Color,
  cTopo: THREE.Color,
  pos: Float32Array,
  h: number
): void {
  const c = new THREE.Color();
  for (let i = 0; i < 36; i++) {
    const t = Math.min(1, Math.max(0, (pos[i * 3 + 1] ?? 0) / h + 0.5));
    c.copy(cBase).lerp(cTopo, t);
    cores[i * 3] = c.r;
    cores[i * 3 + 1] = c.g;
    cores[i * 3 + 2] = c.b;
  }
}

/**
 * Projeção fora de eixo: a cena mantém a mesma imagem de antes, mesmo que o canvas vire a janela
 * inteira. A posição e a orientação da câmera nunca mudam; só a matriz de projeção.
 */
function aplicarProjecao(camera: THREE.PerspectiveCamera, rc: Retangulo, rv: Retangulo): void {
  const l = limitesDaProjecao(rc, rv, PLANO_PROXIMO);
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

/** Estado de uma peça num instante: dimensões, rotação, posição e opacidade. */
interface EstadoPeca {
  dims: DimensoesTronco;
  Q: THREE.Quaternion;
  P: THREE.Vector3;
  o: number;
}

interface Peca {
  readonly nivel: string;
  readonly grupo: THREE.Group;
  readonly geo: THREE.BufferGeometry;
  readonly linhas: LineSegments2;
  readonly mats: THREE.Material[];
  readonly cBase: THREE.Color;
  readonly cTopo: THREE.Color;
  dims: DimensoesTronco;
  readonly Q: THREE.Quaternion;
  readonly P: THREE.Vector3;
  o: number;
  readonly razao: number;
  readonly pele: Pele;
  textoAlfa: number;
  tex: { chave: string | null; textura: THREE.CanvasTexture | null; layout: LeiauteFace | null };
  dimsR: DimensoesTronco;
  baseR: number;
  topoR: number;
  de: EstadoPeca | null;
  t0: number;
  introAtraso: number;
  readonly fantasma: boolean;
}

interface AlvoTextura {
  readonly Lpx: number;
  readonly AmaxPx: number;
  readonly escala: number;
  readonly chave: string;
}

export function criarCena({
  canvas,
  cenaEl,
  perfil,
  paleta,
  escuro,
  reduzido,
  textos
}: OpcoesCena): Cena {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = escuro ? 0.3 : 0.5;
  pmrem.dispose();

  const branco = new THREE.Color(1, 1, 1);
  const hemi = new THREE.HemisphereLight(paleta.fundo, paleta.sombra, 0.7);
  const chave = new THREE.DirectionalLight(branco, 1.5);
  chave.position.set(-3, 6, 5);
  chave.castShadow = true;
  chave.shadow.mapSize.set(1024, 1024);
  Object.assign(chave.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 });
  const contraLuz = new THREE.DirectionalLight(paleta.ouro, escuro ? 1.4 : 0.9);
  contraLuz.position.set(4, 2, -5);
  scene.add(hemi, chave, contraLuz);

  // Três câmeras com a MESMA pose: a principal (renderiza), a de repouso (rótulos e silhueta) e a
  // de voo (polígono final). A pose nunca muda; só a projeção.
  const eye = new THREE.Vector3(0, ALVO_Y + D * Math.sin(ELEVACAO), D * Math.cos(ELEVACAO));
  const criar = (): THREE.PerspectiveCamera => {
    const c = new THREE.PerspectiveCamera(FOV_V, 1, PLANO_PROXIMO, PLANO_DISTANTE);
    c.position.copy(eye);
    c.lookAt(0, ALVO_Y, 0);
    c.updateMatrixWorld(true);
    return c;
  };
  const camera = criar();
  const camRep = criar();
  const camVoo = criar();

  const linhas: LineMaterial[] = [];
  const niveis = new Map<string, Peca>();
  const setas = new Map<string, { grupo: THREE.Group; x: number }>();
  const ancoras = new Map<string, { x: number; y: number }>();
  const nivelsBase = perfil.camadas.map((c) => c.nivel).reverse();
  const fatias = fatiasRepouso(perfil.camadas.length);
  const blocos = blocosNorma();
  const blocoDe: Record<string, (typeof blocos)[number]> = {
    [NORMA_FUNDAMENTAL]: blocos[1],
    'constituicao-logico': blocos[0]
  };

  let ativo: string | null = null;
  let cenaRect: Retangulo = { x: 0, y: 0, w: 1, h: 1 };
  let shiftX = 0;
  let tamanhoAtual = { w: 0, h: 0 };
  let emVoo = false; // true enquanto a volta ainda está em curso (o canvas segue em tela cheia)
  let fatorVoo = 0; // 0 em repouso, 1 com a fatia inteira em voo; comanda o véu e os rótulos
  let dpr = 1;
  const tMontagem = performance.now();

  // Texto da face: uma textura por nível, pintada um nível por quadro, depois que as fontes carregam.
  const contexto2d = document.createElement('canvas').getContext('2d');
  if (!contexto2d) throw new Error('canvas 2D indisponível para medir texto');
  const medida = medidorDoCanvas(contexto2d);
  let fontesProntas = false;
  void Promise.all([
    document.fonts.load(fonteNome(20)),
    document.fonts.load(fonteCorpo(20))
  ]).finally(() => {
    fontesProntas = true;
  });
  let alvoAtual: AlvoTextura | null = null;
  let alvoMudouEm = 0;

  const yBaseGeral = 0;
  const yTopoGeral = ALTURA;

  function materialLinha(cor: THREE.Color, tracejado: boolean, opacidade: number): LineMaterial {
    const mat = new LineMaterial({
      color: cor,
      linewidth: tracejado ? 1.6 : 1.2,
      transparent: true,
      opacity: opacidade,
      dashed: tracejado,
      dashSize: 0.09,
      gapSize: 0.06
    });
    mat.userData.base = opacidade;
    linhas.push(mat);
    return mat;
  }

  // Uma peça: tronco com malha e contorno. Dimensões em voo mudam a cada quadro.
  function criarPeca(
    nivel: string,
    tipo: 'camada' | 'fantasma',
    dims: DimensoesTronco,
    cBase: THREE.Color,
    cTopo: THREE.Color,
    indice: number
  ): Peca {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posicoesTronco(dims), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(36 * 3), 3));
    const fantasma = tipo === 'fantasma';
    const mat = fantasma
      ? new THREE.MeshStandardMaterial({
          color: paleta.areia,
          transparent: true,
          opacity: 0.22,
          roughness: 0.3,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      : new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.55,
          metalness: 0.05,
          flatShading: true,
          transparent: true,
          opacity: 1,
          side: THREE.DoubleSide
        });
    mat.userData.base = fantasma ? 0.22 : 1;
    const malha = new THREE.Mesh(geo, mat);
    const razao = fantasma ? RAZAO_BLOCO : RAZAO_FATIA;
    const pele: Pele = new THREE.Mesh(
      geometriaPele(razao),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        toneMapped: false,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      })
    );
    pele.visible = false;
    pele.frustumCulled = false;
    pele.renderOrder = 2;
    posicionarPele(pele, dims);
    malha.castShadow = !fantasma;
    malha.receiveShadow = !fantasma;
    malha.userData.nivel = nivel;
    const matL = materialLinha(
      fantasma ? paleta.texto : paleta.ouro,
      fantasma,
      fantasma ? 0.9 : 0.75
    );
    const linhasObj = new LineSegments2(
      new LineSegmentsGeometry().setPositions(arestasTronco(dims)),
      matL
    );
    if (fantasma) linhasObj.computeLineDistances();
    const grupo = new THREE.Group();
    grupo.add(malha, linhasObj, pele);
    scene.add(grupo);
    const L: Peca = {
      nivel,
      grupo,
      geo,
      linhas: linhasObj,
      mats: [mat, matL],
      cBase,
      cTopo,
      dims,
      Q: new THREE.Quaternion(),
      P: new THREE.Vector3(),
      o: 1,
      razao,
      pele,
      textoAlfa: 0,
      tex: { chave: null, textura: null, layout: null },
      dimsR: dims,
      baseR: 0,
      topoR: 0,
      de: null,
      t0: tMontagem,
      introAtraso: indice * 110,
      fantasma
    };
    niveis.set(nivel, L);
    return L;
  }

  // Camadas: de baixo para cima, fatias iguais; a cor sobe do petróleo ao ouro claro.
  nivelsBase.forEach((nivel, k) => {
    const f = fatias[k];
    if (!f) return;
    const i = perfil.camadas.findIndex((c) => c.nivel === nivel);
    const base = paleta.petroleo.clone().lerp(paleta.fundo, 0.02 + 0.05 * i);
    const cTopo = base.clone().lerp(paleta.ouroLuz, 0.12);
    const cBase = base.clone().lerp(paleta.sombra, 0.22);
    const dims = dimsRepouso(f);
    const L = criarPeca(nivel, 'camada', dims, cBase, cTopo, i);
    L.dimsR = dims;
    L.baseR = f.base;
    L.topoR = f.topo;
  });

  // Norma fundamental e Constituição em sentido lógico: blocos retos, fora da série.
  perfil.fantasma.forEach((nivel, indice) => {
    const f = blocoDe[nivel];
    if (!f) return;
    const dims = dimsRepouso(f);
    const L = criarPeca(nivel, 'fantasma', dims, paleta.areia, paleta.areia, 0);
    L.dimsR = dims;
    L.baseR = f.base;
    L.topoR = f.topo;
    L.introAtraso = 40 + 90 * indice;
  });

  // Setas de validade e de criação: à esquerda, sem zoom e sem voo.
  for (const s of perfil.setas) {
    const grupo = new THREE.Group();
    const cor = s.sentido === 'cima' ? paleta.petroleo : paleta.texto;
    const altura = ALTURA;
    const hasta = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, altura - 0.12, 10),
      new THREE.MeshStandardMaterial({ color: cor, roughness: 0.4 })
    );
    const ponta = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.12, 14),
      new THREE.MeshStandardMaterial({ color: cor, roughness: 0.4 })
    );
    if (s.sentido === 'cima') ponta.position.y = altura / 2 - 0.06;
    else {
      ponta.position.y = -altura / 2 + 0.06;
      ponta.rotation.x = Math.PI;
    }
    grupo.add(hasta, ponta);
    grupo.position.y = ALTURA / 2;
    scene.add(grupo);
    setas.set(s.nivel, { grupo, x: s.x });
    ancoras.set(s.nivel, { x: s.x, y: ALTURA / 2 });
  }

  // Partículas: poeira dourada ao redor e atrás da pirâmide.
  const posBase = new Float32Array(PARTICULAS * 3);
  const velo = new Float32Array(PARTICULAS);
  const posAtual = new Float32Array(PARTICULAS * 3);
  {
    const rnd = rng(7);
    const yMin = yBaseGeral - 0.4;
    const yMax = yTopoGeral + 0.6;
    for (let i = 0; i < PARTICULAS; i++) {
      posBase[i * 3] = (rnd() * 2 - 1) * 1.6;
      posBase[i * 3 + 1] = yMin + rnd() * (yMax - yMin);
      posBase[i * 3 + 2] = -1.2 + rnd() * 1.5;
      velo[i] = 0.02 + rnd() * 0.05;
    }
    posAtual.set(posBase);
  }
  const geoPart = new THREE.BufferGeometry();
  geoPart.setAttribute('position', new THREE.BufferAttribute(posAtual, 3));
  const matPart = new THREE.PointsMaterial({
    color: paleta.ouro,
    size: 0.05,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: escuro ? THREE.AdditiveBlending : THREE.NormalBlending
  });
  scene.add(new THREE.Points(geoPart, matPart));

  // Efeito da norma fundamental: um valor contínuo, 0 em repouso e 1 com a norma ativa. Halo,
  // raios, contorno tracejado e anel das partículas são todos proporcionais a ele.
  let efeitoValor = 0;
  const LN = niveis.get(NORMA_FUNDAMENTAL) ?? null;
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texturaRadial(paleta.ouro),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  if (LN) {
    halo.position.set(0, 0, -(LN.dimsR.PB / 2 + 0.2)); // atrás do bloco
    LN.grupo.add(halo);
  }
  const posRaios = new Float32Array(RAIOS * 6);
  const geoRaios = new THREE.BufferGeometry();
  geoRaios.setAttribute('position', new THREE.BufferAttribute(posRaios, 3));
  const matRaios = new THREE.LineBasicMaterial({
    color: paleta.ouroLuz,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const raios = new THREE.LineSegments(geoRaios, matRaios);
  const posContorno = new Float32Array(4 * 3);
  const geoContorno = new THREE.BufferGeometry();
  geoContorno.setAttribute('position', new THREE.BufferAttribute(posContorno, 3));
  const matContorno = new THREE.LineDashedMaterial({
    color: paleta.ouro,
    dashSize: 0.07,
    gapSize: 0.05,
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  const contorno = new THREE.LineLoop(geoContorno, matContorno);
  scene.add(raios, contorno);
  const anguloPart = new Float32Array(PARTICULAS);
  {
    const rnd = rng(11);
    for (let i = 0; i < PARTICULAS; i++) anguloPart[i] = rnd() * Math.PI * 2;
  }

  // Opacidade do bloco: a norma vai a opaca; a Constituição a 55%; as outras a 10%.
  function opacidadeDoBloco(nivel: string, base: number): number {
    if (nivel === NORMA_FUNDAMENTAL) return base + (1 - base) * efeitoValor;
    if (nivel === CONSTITUICAO) return base * (1 - 0.45 * efeitoValor);
    return base * (1 - 0.9 * efeitoValor);
  }

  // Atualiza halo, raios e contorno a partir da posição e das dimensões atuais da norma.
  function atualizarEfeitoNorma(agora: number): void {
    if (!LN) return;
    const d = LN.dims;
    const e = efeitoValor;
    halo.material.opacity =
      e * (reduzido ? 0.7 : 0.55 + 0.25 * Math.sin((agora / 2400) * Math.PI * 2));
    const diag = Math.hypot(d.LB, d.h) * 1.35;
    halo.scale.set(diag, diag, 1);
    LN.grupo.updateMatrixWorld(true);
    const apice = new THREE.Vector3(shiftX, yTopoGeral, -0.6);
    for (let i = 0; i < RAIOS; i++) {
      const t = (i + 0.5) / RAIOS;
      const a = LN.grupo.localToWorld(new THREE.Vector3(-d.LB / 2 + t * d.LB, -d.h / 2, d.PB / 2));
      posRaios.set([a.x, a.y, a.z, apice.x, apice.y, apice.z], i * 6);
    }
    geoRaios.attributes.position!.needsUpdate = true;
    matRaios.opacity = e * 0.55;
    cantosFaceFrente(d).forEach(([x, y, z], i) => {
      LN.grupo.localToWorld(new THREE.Vector3(x, y, z + 0.01)).toArray(posContorno, i * 3);
    });
    geoContorno.attributes.position!.needsUpdate = true;
    contorno.computeLineDistances();
    // O traço caminha devagar: as distâncias do tracejado andam com o tempo, em módulo do período.
    const periodo = matContorno.dashSize + matContorno.gapSize;
    const deslocamento = reduzido ? 0 : ((agora / 1000) * VELOCIDADE_CONTORNO) % periodo;
    const distancias = geoContorno.attributes.lineDistance as THREE.BufferAttribute;
    for (let i = 0; i < distancias.count; i++) {
      distancias.array[i] = (distancias.array[i] ?? 0) - deslocamento;
    }
    distancias.needsUpdate = true;
    matContorno.opacity = e * 0.9;
  }

  // Chão: sombra de contato.
  const chao = new THREE.Group();
  chao.position.y = yBaseGeral - 0.22;
  scene.add(chao);
  const sombraChao = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ opacity: escuro ? 0.45 : 0.16 })
  );
  sombraChao.rotation.x = -Math.PI / 2;
  sombraChao.receiveShadow = true;
  const brilhoChao = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 48),
    new THREE.MeshBasicMaterial({
      map: texturaRadial(paleta.sombra),
      transparent: true,
      opacity: escuro ? 0.35 : 0.2,
      depthWrite: false
    })
  );
  brilhoChao.rotation.x = -Math.PI / 2;
  brilhoChao.scale.set(1, 0.4, 1);
  chao.add(sombraChao, brilhoChao);

  // Pose de repouso de um nível: centro na altura do tronco, no eixo, girado por GIRO.
  function repousoDe(L: Peca): EstadoPeca {
    return {
      dims: L.dimsR,
      Q: ROTACAO_GIRO,
      P: new THREE.Vector3(shiftX, (L.baseR + L.topoR) / 2, 0),
      o: 1
    };
  }

  function estadoDe(L: Peca): EstadoPeca {
    return { dims: { ...L.dims }, Q: L.Q.clone(), P: L.P.clone(), o: L.o };
  }

  // Primeira vez que um nível é usado: começa na pose de repouso, nunca na origem.
  function inicializar(L: Peca): void {
    if (L.de !== null) return;
    const r = repousoDe(L);
    L.P.copy(r.P);
    L.Q.copy(r.Q);
    L.de = estadoDe(L);
  }

  function setAtivo(nivel: string | null): void {
    if (nivel === ativo) return;
    ativo = nivel;
    if (nivel === null) emVoo = true; // a volta começa com o canvas ainda em tela cheia
    const agora = performance.now();
    for (const L of niveis.values()) {
      inicializar(L);
      L.de = estadoDe(L);
      L.t0 = agora;
    }
    for (const s of setas.values()) s.grupo.visible = nivel === null;
  }

  function aplicarPeca(L: Peca, dims: DimensoesTronco): void {
    L.dims = dims;
    posicionarPele(L.pele, dims);
    const pos = posicoesTronco(dims);
    const posicao = L.geo.getAttribute('position') as THREE.BufferAttribute;
    posicao.array.set(pos);
    posicao.needsUpdate = true;
    const cor = L.geo.getAttribute('color') as THREE.BufferAttribute;
    aplicarPontos(cor.array, L.cBase, L.cTopo, pos, dims.h);
    cor.needsUpdate = true;
    L.linhas.geometry.setPositions(arestasTronco(dims));
    if (L.fantasma) L.linhas.computeLineDistances();
  }

  function tamanhoPara(cw: number, ch: number): void {
    if (tamanhoAtual.w === cw && tamanhoAtual.h === ch) return;
    tamanhoAtual = { w: cw, h: ch };
    renderer.setPixelRatio(Math.min(dpr, 2));
    renderer.setSize(cw, ch, false);
    const buf = renderer.getDrawingBufferSize(new THREE.Vector2());
    for (const m of linhas) m.resolution.set(buf.x, buf.y);
  }

  // Retângulos da cena e do canvas, na hora da chamada. O canvas em voo é a janela.
  function lerRetangulos(): { r: DOMRect; c: DOMRect } {
    const r = cenaEl.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    cenaRect = { x: r.left, y: r.top, w: r.width, h: r.height };
    return { r, c };
  }

  // Tamanho da face em voo: o do leiaute do texto (ou o provisório, enquanto não há textura).
  function apxDe(L: Peca, rv: Retangulo): number {
    return L.tex.layout ? L.tex.layout.Apx : 0.4 * rv.w;
  }

  function alvoDe(L: Peca, rc: Retangulo, rv: Retangulo): EstadoPeca {
    if (ativo === null) return repousoDe(L);
    if (ativo === L.nivel) {
      const v = poseDeVoo({
        camera,
        rc,
        rv,
        apxPedido: apxDe(L, rv),
        razao: L.razao,
        D
      });
      return {
        dims: v.d,
        Q: new THREE.Quaternion(v.Q.x, v.Q.y, v.Q.z, v.Q.w),
        P: new THREE.Vector3(v.P.x, v.P.y, v.P.z),
        o: 1
      };
    }
    const base = repousoDe(L);
    return {
      dims: base.dims,
      Q: base.Q,
      P: base.P.clone().add(new THREE.Vector3(0, 0, -RECUO_FORA)),
      o: OPAC_FORA
    };
  }

  // Alvo da textura: a janela inteira em voo. A chave muda com a janela; a repintura espera a calma.
  function alvoDaJanela(agora: number): AlvoTextura {
    const vw = Math.max(1, document.documentElement.clientWidth);
    const vh = Math.max(1, document.documentElement.clientHeight);
    const Lpx = Math.round(FRACAO_LARGURA_VOO * vw);
    const AmaxPx = Math.round(FRACAO_ALTURA_FACE * vh);
    const escala = escalaDaTextura(Lpx, window.devicePixelRatio || 1);
    const chaveAlvo = `${Lpx}x${AmaxPx}x${escala}`;
    if (!alvoAtual || alvoAtual.chave !== chaveAlvo) {
      alvoAtual = { Lpx, AmaxPx, escala, chave: chaveAlvo };
      alvoMudouEm = agora;
    }
    return alvoAtual;
  }

  function pintarNivel(L: Peca, alvo: AlvoTextura): void {
    const info = textos.get(L.nivel);
    if (!info) throw new Error(`nível "${L.nivel}" sem texto no conteúdo`);
    const r = pintarFace({
      info,
      Lpx: alvo.Lpx,
      AmaxPx: alvo.AmaxPx,
      razao: L.razao,
      cores: paleta.faceCores,
      escala: alvo.escala,
      medida,
      ornamento: L.nivel === NORMA_FUNDAMENTAL
    });
    const tex = new THREE.CanvasTexture(r.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    // Sem mipmap: com mipmap o rótulo "Exemplo" ficava com 12 px na cor exata, abaixo do mínimo.
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    if (L.tex.textura) L.tex.textura.dispose();
    L.tex = { chave: alvo.chave, textura: tex, layout: r.layout };
    // Envio à placa já na pintura: sem isso, o primeiro uso (no meio do voo) paga a subida inteira.
    renderer.initTexture(tex);
    L.pele.material.map = tex;
    L.pele.material.needsUpdate = true;
  }

  // Um nível por quadro. Devolve true enquanto há texto por pintar (o quadro segue pedido).
  function atualizarTexturas(agora: number): boolean {
    if (!fontesProntas) return true;
    const alvo = alvoDaJanela(agora);
    if (agora - alvoMudouEm < ESPERA_TEXTURA_MS) return true;
    const L = [...niveis.values()].find((x) => x.tex.chave !== alvo.chave);
    if (!L) return false;
    pintarNivel(L, alvo);
    return true;
  }

  function animar(agora: number, dt: number): boolean {
    // Estado do palco primeiro: em voo, o canvas vira a janela; só então se lê o retângulo dele.
    const voo = ativo !== null || emVoo;
    canvas.classList.toggle('pir-tela--voo', voo);
    const { r: cenaR, c: canvasR } = lerRetangulos();
    const cw = Math.max(1, Math.round(cenaR.width));
    const ch = Math.max(1, Math.round(cenaR.height));
    shiftX = deslocamentoX(cw, ch);
    chao.position.x = shiftX;
    for (const s of setas.values()) s.grupo.position.x = shiftX + s.x;

    const rcRep: Retangulo = { x: 0, y: 0, w: cw, h: ch };
    aplicarProjecao(camRep, rcRep, rcRep);
    let rc = rcRep;
    let rv = rcRep;
    if (voo) {
      const vw = Math.max(1, Math.round(canvasR.width));
      const vh = Math.max(1, Math.round(canvasR.height));
      rc = { x: cenaR.left - canvasR.left, y: cenaR.top - canvasR.top, w: cw, h: ch };
      rv = { x: 0, y: 0, w: vw, h: vh };
      tamanhoPara(vw, vh);
    } else {
      tamanhoPara(cw, ch);
    }
    aplicarProjecao(camera, rc, rv);
    camera.updateMatrixWorld(true);

    // Efeito da norma: sobe com a norma ativa e desce ao sair; com movimento reduzido, troca de uma vez.
    const alvoEfeito = ativo === NORMA_FUNDAMENTAL ? 1 : 0;
    if (reduzido) efeitoValor = alvoEfeito;
    else if (alvoEfeito > efeitoValor)
      efeitoValor = Math.min(alvoEfeito, efeitoValor + dt / DUR_EFEITO);
    else efeitoValor = Math.max(alvoEfeito, efeitoValor - dt / DUR_EFEITO);
    let anim = atualizarTexturas(agora);
    if (efeitoValor !== alvoEfeito) anim = true;
    let algumaVolta = false;
    let eVeil = 0;
    let pVeil: number | null = null;
    for (const L of niveis.values()) {
      const ehAtivo = ativo === L.nivel;
      const alvo = alvoDe(L, rc, rv);
      const dur =
        ativo === null
          ? DUR_VOLTA
          : ehAtivo && L.nivel === NORMA_FUNDAMENTAL
            ? DUR_IDA_NORMA
            : DUR_IDA;
      const p = reduzido ? 1 : Math.min(1, Math.max(0, (agora - L.t0) / dur));
      if (p < 1) anim = true;
      if (ativo === null && p < 1) algumaVolta = true;
      if (pVeil === null) pVeil = p;
      inicializar(L);
      const de = L.de as EstadoPeca;
      const e = easeInOutCubic(p);
      const ep = ehAtivo && ativo !== null ? easeOutCubic(p) : easeInOutCubic(p);
      const dims = lerpDims(de.dims, alvo.dims, e);
      L.Q.copy(de.Q).slerp(alvo.Q, e);
      L.P.copy(de.P).lerp(alvo.P, ep);
      L.o = de.o + (alvo.o - de.o) * e;
      if (ativo === L.nivel) eVeil = e;

      const q = reduzido
        ? 1
        : Math.min(1, Math.max(0, (agora - tMontagem - L.introAtraso) / DUR_INTRO));
      const intro = easeOutCubic(q);
      if (q < 1) anim = true;
      aplicarPeca(L, dims);
      L.grupo.position.set(L.P.x, L.P.y - (1 - intro) * 0.9, L.P.z);
      L.grupo.quaternion.copy(L.Q);
      for (const m of L.mats)
        m.opacity = opacidadeDoBloco(L.nivel, (m.userData.base as number) * L.o * intro);
      const textoAlvo =
        ehAtivo && ativo !== null
          ? Math.min(1, Math.max(0, (p - INICIO_TEXTO) / (FIM_TEXTO - INICIO_TEXTO)))
          : 0;
      L.textoAlfa = Math.max(textoAlvo, L.textoAlfa - dt / 0.25);
      L.pele.material.opacity = L.textoAlfa * L.o * intro;
      // Visível desde a primeira textura (opacidade zero em repouso): o programa de sombreamento compila antes do voo.
      L.pele.visible = !!L.tex.textura;
    }
    // Próximo quadro: se o palco vai mudar de estado (a volta acabou), pede mais um quadro para o
    // canvas voltar ao tamanho da cena.
    atualizarEfeitoNorma(agora);
    const proximoVoo = ativo !== null || algumaVolta;
    if (proximoVoo !== voo) anim = true;
    emVoo = proximoVoo;

    fatorVoo =
      ativo !== null ? eVeil : algumaVolta && pVeil !== null ? 1 - easeInOutCubic(pVeil) : 0;

    // Véu: a cor de limpeza do canvas escurece a página atrás da fatia em voo.
    if (ativo !== null) {
      const cor = ativo === NORMA_FUNDAMENTAL ? new THREE.Color('#070f1c') : paleta.fundo;
      renderer.setClearColor(cor, (ativo === NORMA_FUNDAMENTAL ? 0.82 : 0.6) * eVeil);
    } else if (algumaVolta && pVeil !== null) {
      renderer.setClearColor(paleta.fundo, 0.6 * (1 - easeInOutCubic(pVeil)));
    } else {
      renderer.setClearColor(0x000000, 0);
    }

    // Partículas: deriva lenta e cintilação.
    if (!reduzido) {
      anim = true;
      const dt2 = Math.min(dt, 0.05);
      const yMin = yBaseGeral - 0.4;
      const yMax = yTopoGeral + 0.6;
      // Com a norma: as partículas vão para um anel atrás do plano da face (nunca à frente do texto).
      const fracaoAnel = LN && efeitoValor > 0 ? efeitoValor * 0.85 : 0;
      const d = LN ? LN.dims : null;
      const rx = d ? (d.LB / 2) * 1.18 + 0.05 : 0;
      const ry = d ? (d.h / 2) * 1.18 : 0;
      const cx = LN ? LN.grupo.position.x : 0;
      const cy = LN ? LN.grupo.position.y : 0;
      const cz = LN ? LN.grupo.position.z - 0.1 : 0;
      for (let i = 0; i < PARTICULAS; i++) {
        posBase[i * 3 + 1] = (posBase[i * 3 + 1] ?? 0) + (velo[i] ?? 0) * dt2;
        if ((posBase[i * 3 + 1] ?? 0) > yMax) posBase[i * 3 + 1] = yMin;
        posAtual[i * 3] = posBase[i * 3] ?? 0;
        posAtual[i * 3 + 1] = posBase[i * 3 + 1] ?? 0;
        posAtual[i * 3 + 2] = posBase[i * 3 + 2] ?? 0;
        if (fracaoAnel > 0) {
          const a = anguloPart[i] ?? 0;
          const ax = cx + Math.cos(a) * rx;
          const ay = cy + Math.sin(a) * ry;
          posAtual[i * 3] = (posAtual[i * 3] ?? 0) + (ax - (posAtual[i * 3] ?? 0)) * fracaoAnel;
          posAtual[i * 3 + 1] =
            (posAtual[i * 3 + 1] ?? 0) + (ay - (posAtual[i * 3 + 1] ?? 0)) * fracaoAnel;
          posAtual[i * 3 + 2] =
            (posAtual[i * 3 + 2] ?? 0) + (cz - (posAtual[i * 3 + 2] ?? 0)) * fracaoAnel;
        }
      }
      geoPart.attributes.position!.needsUpdate = true;
      matPart.opacity = 0.5 + 0.2 * Math.sin((agora / 1000) * 2.1);
      matPart.color.copy(paleta.ouro).lerp(paleta.ouroLuz, efeitoValor * 0.6);
    }
    return anim;
  }

  // Pose de repouso já na criação: a figura não pode depender de um quadro para existir na cena.
  function prepararRepouso(): void {
    const r = cenaEl.getBoundingClientRect();
    shiftX = deslocamentoX(Math.max(1, r.width), Math.max(1, r.height));
    chao.position.x = shiftX;
    for (const s of setas.values()) s.grupo.position.x = shiftX + s.x;
    for (const L of niveis.values()) {
      inicializar(L);
      L.grupo.position.copy(L.P);
      L.grupo.quaternion.copy(L.Q);
    }
  }
  prepararRepouso();

  function render(): void {
    renderer.render(scene, camera);
  }

  // Projeção de um ponto do mundo (pose de repouso) em px da cena. Usa a câmera de repouso.
  function projetarRepouso(v: THREE.Vector3): { x: number; y: number } {
    const p = v.clone().project(camRep);
    return {
      x: ((p.x + 1) / 2) * cenaRect.w,
      y: ((1 - p.y) / 2) * cenaRect.h
    };
  }

  function paraCliente(p: { x: number; y: number }): Ponto {
    return { x: cenaRect.x + p.x, y: cenaRect.y + p.y };
  }

  // Cantos da silhueta de repouso de um nível, em px do cliente.
  function silhuetaRepouso(L: Peca): Ponto[] {
    const base = repousoDe(L);
    return cantosTronco(L.dimsR)
      .map(([x, y, z]) => new THREE.Vector3(x, y, z).applyQuaternion(base.Q).add(base.P))
      .map((v) => paraCliente(projetarRepouso(v)));
  }

  // Face da frente de repouso de um nível: os 4 cantos em px do cliente e a distância do centro da
  // face até o observador (desempate entre faces que se tocam numa aresta).
  function frenteRepouso(L: Peca): FrenteRepouso {
    const base = repousoDe(L);
    const locais = cantosFaceFrente(L.dimsR).map(([x, y, z]) =>
      new THREE.Vector3(x, y, z).applyQuaternion(base.Q).add(base.P)
    );
    const centro = locais
      .reduce((s, v) => s.add(v), new THREE.Vector3())
      .multiplyScalar(1 / locais.length);
    const poligono = locais.map((v) => paraCliente(projetarRepouso(v)));
    return { poligono, profundidade: centro.distanceTo(camRep.position) };
  }

  function poligonoDe(
    dims: DimensoesTronco,
    Q: THREE.Quaternion,
    P: THREE.Vector3,
    cam: THREE.PerspectiveCamera
  ): Ponto[] {
    return cantosFaceFrente(dims)
      .map(([x, y, z]) => new THREE.Vector3(x, y, z).applyQuaternion(Q).add(P))
      .map((v) => {
        const p = v.clone().project(cam);
        return { x: p.x, y: p.y };
      });
  }

  return {
    setAtivo,
    animar,
    render,
    redimensionar(novoDpr: number) {
      dpr = novoDpr || 1;
    },
    // Opacidade dos rótulos e das guias: acompanha o voo (1 em repouso, 0 com a fatia inteira em voo).
    opacidadeRotulos() {
      return 1 - fatorVoo;
    },
    // Rótulos: ponto de ancoragem no centro do nível, em px da cena (repouso).
    projetar(chaveNivel: string) {
      const L = niveis.get(chaveNivel);
      if (L) return projetarRepouso(new THREE.Vector3(shiftX, (L.baseR + L.topoR) / 2, 0));
      const a = ancoras.get(chaveNivel);
      if (a) return projetarRepouso(new THREE.Vector3(shiftX + a.x, a.y, 0));
      return { x: 0, y: 0 };
    },
    // Silhueta de repouso (cliente) de cada nível com face.
    silhuetas() {
      lerRetangulos(); // a página pode ter rolado sem quadro: o retângulo tem de ser lido agora
      const mapa = new Map<string, Ponto[]>();
      for (const L of niveis.values()) mapa.set(L.nivel, silhuetaRepouso(L));
      return mapa;
    },
    // Face da frente de repouso de cada nível com face (cliente): quem decide o ponteiro.
    frentes() {
      lerRetangulos();
      const mapa = new Map<string, FrenteRepouso>();
      for (const L of niveis.values()) mapa.set(L.nivel, frenteRepouso(L));
      return mapa;
    },
    // Polígono final da face em voo (cliente), calculado pelas fórmulas, não pela animação.
    poligonoFinal(nivel: string) {
      if (ativo !== nivel) return null;
      const L = niveis.get(nivel);
      if (!L) return null;
      const { r, c } = lerRetangulos();
      const cw = Math.max(1, Math.round(r.width));
      const ch = Math.max(1, Math.round(r.height));
      const rc: Retangulo = { x: r.left - c.left, y: r.top - c.top, w: cw, h: ch };
      const rv: Retangulo = {
        x: 0,
        y: 0,
        w: Math.max(1, Math.round(c.width)),
        h: Math.max(1, Math.round(c.height))
      };
      aplicarProjecao(camVoo, rc, rv);
      camVoo.updateMatrixWorld(true);
      const v = poseDeVoo({ camera: camVoo, rc, rv, apxPedido: apxDe(L, rv), razao: L.razao, D });
      return poligonoDe(
        v.d,
        new THREE.Quaternion(v.Q.x, v.Q.y, v.Q.z, v.Q.w),
        new THREE.Vector3(v.P.x, v.P.y, v.P.z),
        camVoo
      ).map((p) => ({
        x: c.left + ((p.x + 1) / 2) * rv.w,
        y: c.top + ((1 - p.y) / 2) * rv.h
      }));
    },
    dispose() {
      scene.traverse((o) => {
        const obj = o as THREE.Object3D & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const ms = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of ms) {
            const comMapa = m as THREE.Material & { map?: THREE.Texture | null };
            if (comMapa.map) comMapa.map.dispose();
            m.dispose();
          }
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
