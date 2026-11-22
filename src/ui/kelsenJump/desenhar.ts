import type { Cena, FormaCena } from '@/app/kelsenJump';
import { KELSEN, MUNDO } from '@/app/kelsenJump';

/** Linha do chão na tela lógica (y cresce para baixo). Pés do Kelsen em y = CHAO - pe. */
export const CHAO_TELA = 290;

export interface Cores {
  readonly tinta: string;
  readonly papel: string;
}

/** Desenha um frame do jogo em preto e branco, com as cores do tema lidas do CSS. */
export function desenharCena(ctx: CanvasRenderingContext2D, cena: Cena, cores: Cores): void {
  const { tinta, papel } = cores;
  ctx.fillStyle = papel;
  ctx.fillRect(0, 0, MUNDO.largura, MUNDO.altura);
  ctx.strokeStyle = tinta;
  ctx.fillStyle = tinta;
  ctx.lineWidth = 2;

  desenharChao(ctx, cena.distancia, tinta);
  for (const forma of cena.obstaculos) {
    if (forma.tipo === 'piramide') desenharPiramide(ctx, forma, papel, tinta);
    else desenharNuvem(ctx, forma, papel, tinta);
  }
  desenharKelsen(ctx, cena, tinta);
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

function desenharNuvem(
  ctx: CanvasRenderingContext2D,
  n: Extract<FormaCena, { tipo: 'nuvem' }>,
  papel: string,
  tinta: string
): void {
  const topo = CHAO_TELA - (n.baseY + n.altura);
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
  ctx.fillStyle = tinta;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(n.texto, n.x + n.largura / 2, topo + n.altura / 2);
}

/** Kelsen: traço simples. Em pé tem a altura do corpo; agachado, o tronco desce e a cabeça abaixa. */
function desenharKelsen(ctx: CanvasRenderingContext2D, cena: Cena, tinta: string): void {
  const { x, pe, altura } = cena.corpo;
  const pesY = CHAO_TELA - pe;
  const topo = pesY - altura;
  const cx = x + KELSEN.largura / 2;
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
