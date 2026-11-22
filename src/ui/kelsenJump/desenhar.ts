import type { Cena, FormaCena } from '@/app/kelsenJump';
import type { RotuloCena } from '@/app/kelsenJump';
import { KELSEN, MUNDO, ROTULO_NHF } from '@/app/kelsenJump';
import { imagemDoQuadro, TAMANHO_QUADRO } from './sprites';

/** Linha do chão na tela lógica (y cresce para baixo). Pés do Kelsen em y = CHAO - pe. */
export const CHAO_TELA = 290;

export interface Cores {
  readonly tinta: string;
  readonly papel: string;
  /** Tema escuro: os quadros do Kelsen usam a versão invertida (branco sobre preto). */
  readonly escuro: boolean;
}

/** Desenha um frame do jogo em preto e branco, com as cores do tema lidas do CSS. */
/**
 * Placar do canto superior direito: o recorde na primeira linha e a pontuação atual logo abaixo, em
 * negrito e na cor da tinta. Ocupa só `ALTURA_PLACAR` px do topo, acima de qualquer corpo ou obstáculo.
 */
export const PLACAR = { fonte: 16, margem: 12, linha: 20 } as const;
export const ALTURA_PLACAR = PLACAR.margem + PLACAR.linha + PLACAR.fonte;

export function desenharCena(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  cores: Cores,
  recorde: number
): void {
  const { tinta, papel, escuro } = cores;
  ctx.fillStyle = papel;
  ctx.fillRect(0, 0, MUNDO.largura, MUNDO.altura);
  ctx.strokeStyle = tinta;
  ctx.fillStyle = tinta;
  ctx.lineWidth = 2;

  desenharChao(ctx, cena.distancia, tinta);
  for (const forma of cena.obstaculos) {
    if (forma.tipo === 'piramide') desenharPiramide(ctx, forma, papel, tinta);
    else desenharNuvem(ctx, forma, papel, tinta, escuro);
  }
  for (const rotulo of cena.rotulos) desenharRotulo(ctx, rotulo, tinta);
  desenharKelsen(ctx, cena, tinta, escuro);
  desenharPlacar(ctx, recorde, cena.pontuacao, tinta);
}

/** Quadro do PixelLab para a pose: pulo congela o quadro de corrida; batida usa o parado. */
function nomeDoQuadro(pose: Cena['corpo']['pose'], quadro: 0 | 1): string {
  switch (pose) {
    case 'parado':
    case 'batida':
      return 'parado-0';
    case 'pulando':
      return 'correndo-1';
    case 'abaixado':
      return `abaixado-${quadro}`;
    case 'correndo':
      return `correndo-${quadro}`;
  }
}

/** O cenário anda: marcas no chão rolam com a distância percorrida. */
function desenharChao(ctx: CanvasRenderingContext2D, distancia: number, tinta: string): void {
  ctx.strokeStyle = tinta;
  ctx.beginPath();
  ctx.moveTo(0, CHAO_TELA + 0.5);
  ctx.lineTo(MUNDO.largura, CHAO_TELA + 0.5);
  ctx.stroke();
  const passo = 64;
  const deslocamento = distancia % passo;
  for (let x = -deslocamento; x < MUNDO.largura; x += passo) {
    ctx.beginPath();
    ctx.moveTo(x, CHAO_TELA + 10);
    ctx.lineTo(x + 18, CHAO_TELA + 10);
    ctx.stroke();
  }
}

function desenharPiramide(
  ctx: CanvasRenderingContext2D,
  p: Extract<FormaCena, { tipo: 'piramide' }>,
  papel: string,
  tinta: string
): void {
  const cx = p.x + p.largura / 2;
  ctx.fillStyle = papel;
  ctx.strokeStyle = tinta;
  for (const degrau of p.degraus) {
    ctx.beginPath();
    degrau.forEach(([px, py], i) => {
      const sx = cx + px;
      const sy = CHAO_TELA - py;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/**
 * Nuvem: só o desenho do PNG do PixelLab, sem suavização. A caixa do PNG é a caixa de colisão (mesma
 * escala). O "NHF" não fica dentro da nuvem: é escrito uma vez por grupo, por `desenharRotulo`.
 * Sem a imagem, a nuvem de traço de reserva.
 */
function desenharNuvem(
  ctx: CanvasRenderingContext2D,
  n: Extract<FormaCena, { tipo: 'nuvem' }>,
  papel: string,
  tinta: string,
  escuro: boolean
): void {
  const topo = CHAO_TELA - (n.baseY + n.altura);
  const imagem = imagemDoQuadro('nuvem', escuro);
  if (imagem) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(imagem, Math.round(n.x), Math.round(topo), n.largura, n.altura);
  } else {
    desenharNuvemDeTraco(ctx, n, topo, papel, tinta);
  }
}

/**
 * "NHF" centrado logo acima do grupo, em negrito, na cor da tinta (no escuro, a tinta é clara, então o
 * rótulo sai invertido junto com o resto). Só desenho: não entra na colisão.
 */
function desenharRotulo(ctx: CanvasRenderingContext2D, rotulo: RotuloCena, tinta: string): void {
  ctx.fillStyle = tinta;
  ctx.font = `bold ${ROTULO_NHF.fonte}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rotulo.texto, rotulo.x, CHAO_TELA - rotulo.alturaChao);
}

function desenharNuvemDeTraco(
  ctx: CanvasRenderingContext2D,
  n: Extract<FormaCena, { tipo: 'nuvem' }>,
  topo: number,
  papel: string,
  tinta: string
): void {
  const base = CHAO_TELA - n.baseY;
  const raio = n.altura / 2;
  ctx.fillStyle = papel;
  ctx.strokeStyle = tinta;
  ctx.beginPath();
  ctx.moveTo(n.x + raio, topo);
  ctx.lineTo(n.x + n.largura - raio, topo);
  ctx.arc(n.x + n.largura - raio, topo + raio, raio, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(n.x + raio, base);
  ctx.arc(n.x + raio, topo + raio, raio, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/**
 * Kelsen. Com os quadros carregados, desenha o sprite com os pés na linha do chão, sem suavização
 * (pixel art), centrado na caixa de colisão. Sem imagem, usa o traço de reserva: em pé tem a altura
 * do corpo; agachado, o tronco desce e a cabeça abaixa.
 */
function desenharKelsen(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  tinta: string,
  escuro: boolean
): void {
  const { x, pe, altura, pose, quadro, tremor } = cena.corpo;
  const pesY = CHAO_TELA - pe;
  const cx = x + KELSEN.largura / 2 + tremor;
  const imagem = imagemDoQuadro(nomeDoQuadro(pose, quadro), escuro);
  if (imagem) {
    const { largura, altura: alturaCanvas } = TAMANHO_QUADRO;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      imagem,
      Math.round(cx - largura / 2),
      Math.round(pesY - alturaCanvas),
      largura,
      alturaCanvas
    );
    return;
  }
  desenharKelsenDeTraco(ctx, cx, pesY, altura, tinta);
}

function desenharKelsenDeTraco(
  ctx: CanvasRenderingContext2D,
  cx: number,
  pesY: number,
  altura: number,
  tinta: string
): void {
  const topo = pesY - altura;
  ctx.strokeStyle = tinta;
  ctx.fillStyle = tinta;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const raioCabeca = 6;
  ctx.beginPath();
  ctx.arc(cx, topo + raioCabeca, raioCabeca, 0, Math.PI * 2);
  ctx.fill();
  const pescoco = topo + raioCabeca * 2;
  const quadril = pesY - (altura < KELSEN.alturaEmPe ? 12 : 22);
  ctx.beginPath();
  ctx.moveTo(cx, pescoco);
  ctx.lineTo(cx, quadril);
  ctx.moveTo(cx, pescoco + 6);
  ctx.lineTo(cx - 8, quadril - 6);
  ctx.moveTo(cx, pescoco + 6);
  ctx.lineTo(cx + 8, quadril - 6);
  ctx.moveTo(cx, quadril);
  ctx.lineTo(cx - 7, pesY);
  ctx.moveTo(cx, quadril);
  ctx.lineTo(cx + 7, pesY);
  ctx.stroke();
}

/** Placar por cima de tudo: alinhado à direita, com margem; só desenho, fora da colisão. */
function desenharPlacar(
  ctx: CanvasRenderingContext2D,
  recorde: number,
  pontuacao: number,
  tinta: string
): void {
  ctx.fillStyle = tinta;
  ctx.font = `bold ${PLACAR.fonte}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  const x = MUNDO.largura - PLACAR.margem;
  ctx.fillText(`Recorde: ${recorde}`, x, PLACAR.margem);
  ctx.fillText(`Pontuação: ${pontuacao}`, x, PLACAR.margem + PLACAR.linha);
}
