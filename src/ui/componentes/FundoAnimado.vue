<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';

const props = defineProps<{ altura: number }>();

// Opcional (undefined) de propósito: alguns testes de componente montam
// este arquivo isolado, sem o provide do composition root.
const storeModoAdaptado = inject(CHAVE_STORE_MODO_ADAPTADO, undefined);

const canvasRef = ref<HTMLCanvasElement | undefined>();
let quadro: number | undefined;
let observadorVisibilidade: IntersectionObserver | undefined;
let ativo = true;
// Guardados fora do onMounted para o watcher abaixo poder parar/retomar a
// animação sem precisar remontar o componente inteiro.
let ctxSalvo: CanvasRenderingContext2D | undefined;
let larguraSalva = 0;
let alturaSalva = 0;

// Limites fixados ANTES de qualquer medição (L-43, seção 6): a área de
// backing store do canvas é a causa mais comum de o WebKit derrubar a aba
// em aparelho móvel por memória.
const AREA_MAXIMA_PIXELS = 4_000_000;
const DPR_MAXIMO = 2;

function prefereMovimentoReduzido(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Modo de leitura adaptada (docs/modo-adaptado.md, seção 6): desliga todo
 * movimento da página, mesmo que o sistema não peça prefers-reduced-motion,
 * porque o próprio ganho de contraste do modo é anulado por um fundo que
 * continua em movimento atrás do texto.
 *
 * Achado 1 da revisão (docs/revisao-modo-adaptado.md): a versão anterior só
 * lia `document.documentElement.hasAttribute('data-modo-adaptado')` uma vez,
 * em onMounted — ligar o modo com a home já aberta (sem recarregar) não
 * parava a animação em curso. Agora o componente injeta o store de verdade
 * e observa `ativo` ao vivo (watcher abaixo), então esta função só serve
 * para a decisão inicial em onMounted; o caminho reativo é o watcher.
 */
function prefereModoAdaptado(): boolean {
  return Boolean(storeModoAdaptado?.ativo.value);
}

function desenharQuadroEstatico(
  ctx: CanvasRenderingContext2D,
  largura: number,
  altura: number
): void {
  const gradiente = ctx.createLinearGradient(0, 0, 0, altura);
  gradiente.addColorStop(0, '#0d2440');
  gradiente.addColorStop(1, '#163a5f');
  ctx.fillStyle = gradiente;
  ctx.fillRect(0, 0, largura, altura);
}

function animar(ctx: CanvasRenderingContext2D, largura: number, altura: number): void {
  let t = 0;
  function passo(): void {
    if (!ativo) return;
    t += 0.004;
    const gradiente = ctx.createLinearGradient(0, 0, largura, altura);
    gradiente.addColorStop(0, '#0d2440');
    gradiente.addColorStop((Math.sin(t) + 1) / 2, '#163a5f');
    gradiente.addColorStop(1, '#0d2440');
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, largura, altura);
    quadro = requestAnimationFrame(passo);
  }
  quadro = requestAnimationFrame(passo);
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAXIMO);
  const larguraCss = canvas.clientWidth || window.innerWidth;
  const alturaCss = props.altura;
  let largura = Math.floor(larguraCss * dpr);
  let altura = Math.floor(alturaCss * dpr);
  if (largura * altura > AREA_MAXIMA_PIXELS) {
    const fator = Math.sqrt(AREA_MAXIMA_PIXELS / (largura * altura));
    largura = Math.floor(largura * fator);
    altura = Math.floor(altura * fator);
  }
  canvas.width = largura;
  canvas.height = altura;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // Desistência: sem contexto, o fundo cai para o gradiente CSS estático
    // já definido no elemento pai (nenhuma informação do site vive aqui).
    canvas.style.display = 'none';
    return;
  }

  ctxSalvo = ctx;
  larguraSalva = largura;
  alturaSalva = altura;

  if (prefereMovimentoReduzido() || prefereModoAdaptado()) {
    desenharQuadroEstatico(ctx, largura, altura);
    return;
  }

  if (typeof IntersectionObserver !== 'undefined') {
    observadorVisibilidade = new IntersectionObserver(([entrada]) => {
      ativo = Boolean(entrada?.isIntersecting) && document.visibilityState === 'visible';
      if (ativo && quadro === undefined) animar(ctx, largura, altura);
    });
    observadorVisibilidade.observe(canvas);
  }

  document.addEventListener('visibilitychange', () => {
    ativo = document.visibilityState === 'visible';
  });

  animar(ctx, largura, altura);
});

/**
 * Achado 1 (docs/revisao-modo-adaptado.md): reage AO VIVO à alternância do
 * modo adaptado, sem esperar recarregar a página. Ligar o modo para a
 * animação em curso e desenha o quadro estático; desligar retoma a
 * animação (a menos que o sistema peça prefers-reduced-motion, que nunca
 * é anulado pelo desligamento do modo).
 */
watch(
  () => storeModoAdaptado?.ativo.value,
  (ligado) => {
    if (!ctxSalvo) return;
    if (ligado) {
      if (quadro !== undefined) {
        cancelAnimationFrame(quadro);
        quadro = undefined;
      }
      desenharQuadroEstatico(ctxSalvo, larguraSalva, alturaSalva);
    } else if (!prefereMovimentoReduzido() && quadro === undefined) {
      ativo = true;
      animar(ctxSalvo, larguraSalva, alturaSalva);
    }
  }
);

onBeforeUnmount(() => {
  ativo = false;
  if (quadro !== undefined) cancelAnimationFrame(quadro);
  observadorVisibilidade?.disconnect();
});
</script>

<template>
  <canvas
    ref="canvasRef"
    class="fundo-animado"
    :style="{ height: `${altura}px` }"
    aria-hidden="true"
  />
</template>

<style scoped>
.fundo-animado {
  display: block;
  width: 100%;
  /* Gradiente CSS estático: o que fica visível se o contexto 2D falhar. */
  background: linear-gradient(180deg, #0d2440, #163a5f);
}
</style>
