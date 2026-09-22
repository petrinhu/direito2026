<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{ altura: number }>();

const canvasRef = ref<HTMLCanvasElement | undefined>();
let quadro: number | undefined;
let observadorVisibilidade: IntersectionObserver | undefined;
let ativo = true;

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
 * continua em movimento atrás do texto. Lida direto do atributo, não de um
 * store injetado: o mesmo padrão de checagem única no setup já usado para
 * prefers-reduced-motion acima, e o atributo já está aplicado em
 * document.documentElement antes deste componente montar (o store é criado
 * de forma síncrona em main.ts, antes de app.mount).
 */
function prefereModoAdaptado(): boolean {
  return (
    typeof document !== 'undefined' && document.documentElement.hasAttribute('data-modo-adaptado')
  );
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
