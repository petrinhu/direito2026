<script setup lang="ts">
/* global SVGSVGElement, ResizeObserver, MutationObserver, Element, MediaQueryList */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { Markmap } from 'markmap-view';
import type { MapaFichamento } from '@/core/fichamento/tipos';
import {
  definirTodosRamos,
  paraArvoreMarkmap,
  todosRamosAbertos,
  type NoMarkmap
} from '@/app/fichamento';

const props = defineProps<{
  dados: MapaFichamento;
  /** Endereço da unidade sem barra final. */
  baseUnidade: string;
  /** Sem animação: modo adaptado ou preferência do sistema. */
  reduzirMovimento: boolean;
}>();

const NUMERO_DE_TONS = 6;
const FONTE_PX = 16;
/** Texto nunca abaixo de 12px efetivos no celular. */
const ESCALA_MINIMA = 12 / FONTE_PX;
const LARGURA_CELULAR = 640;

const hospedeiro = ref<HTMLElement>();
const svgRef = ref<SVGSVGElement>();
const tudoAberto = ref(false);
const falhou = ref(false);
const rotuloTodos = computed(() =>
  tudoAberto.value ? 'Recolher todos os ramos' : 'Abrir todos os ramos'
);

let mapa: Markmap | undefined;
let raiz: NoMarkmap;
let observadorTamanho: ResizeObserver | undefined;
let observadorTema: MutationObserver | undefined;
let consultaEscuro: MediaQueryList | undefined;
let larguraAnterior = 0;
let destruido = false;

function modoAdaptado(): boolean {
  return document.documentElement.getAttribute('data-modo-adaptado') === 'on';
}

function celular(): boolean {
  return (hospedeiro.value?.clientWidth ?? LARGURA_CELULAR) < LARGURA_CELULAR;
}

/** Lê os tokens em tempo de execução: vale para tema claro, escuro e adaptado. */
function corDoRamo(ramo: number | undefined): string {
  if (modoAdaptado()) return '#000000';
  const estilo = getComputedStyle(document.documentElement);
  const nome =
    ramo === undefined
      ? '--cor-mapa-linha'
      : `--cor-mapa-ramo-${(ramo % NUMERO_DE_TONS) + 1}-fundo`;
  return estilo.getPropertyValue(nome).trim() || '#5f7189';
}

function opcoes(): Partial<import('markmap-view').IMarkmapOptions> {
  const estreito = celular();
  return {
    autoFit: true,
    duration: props.reduzirMovimento || modoAdaptado() ? 0 : 250,
    initialExpandLevel: -1,
    maxWidth: estreito ? 200 : 260,
    maxInitialScale: 1.2,
    paddingX: 8,
    spacingHorizontal: estreito ? 50 : 80,
    spacingVertical: 8,
    color: (no) => corDoRamo((no.payload as { ramo?: number } | undefined)?.ramo)
  };
}

function atualizarRotulo(): void {
  tudoAberto.value = mapa?.state.data
    ? todosRamosAbertos(mapa.state.data as unknown as NoMarkmap)
    : false;
}

function escalaAtual(): number {
  const transformacao = mapa?.g.attr('transform') ?? '';
  const m = /scale\(([\d.]+)\)/.exec(transformacao);
  return m ? Number(m[1]) : 1;
}

/** fit() não tem escala mínima: no celular o texto não pode ficar abaixo de 12px, o resto é pan. */
async function garantirLegibilidade(): Promise<void> {
  if (!mapa || !celular()) return;
  const k = escalaAtual();
  if (k > 0 && k < ESCALA_MINIMA) {
    await mapa.rescale(ESCALA_MINIMA / k);
    if (mapa.state.data) await mapa.ensureVisible(mapa.state.data, { left: 8, top: 8 });
  }
}

async function centralizar(): Promise<void> {
  await mapa?.fit();
}

async function alternarTodos(): Promise<void> {
  if (!mapa?.state.data) return;
  definirTodosRamos(mapa.state.data as unknown as NoMarkmap, !tudoAberto.value);
  await mapa.renderData();
  atualizarRotulo();
}

/** O círculo já abre e fecha (nativo); o toque no texto do pensador faz o mesmo, sem pegar o link. */
function aoClicarNoTexto(evento: MouseEvent): void {
  const alvo = evento.target as Element;
  if (alvo.closest('a') || alvo.closest('circle')) return;
  const grupo = alvo.closest('g.markmap-node') as (Element & { __data__?: unknown }) | null;
  if (!grupo?.__data__) return;
  void mapa?.toggleNode(grupo.__data__ as Parameters<Markmap['toggleNode']>[0]);
}

async function criar(): Promise<void> {
  if (mapa || destruido || !svgRef.value) return;
  try {
    const { Markmap } = await import('markmap-view');
    if (destruido) return;
    raiz = paraArvoreMarkmap(props.dados, props.baseUnidade);
    mapa = Markmap.create(svgRef.value, opcoes(), raiz);

    const alternarOriginal = mapa.toggleNode.bind(mapa);
    mapa.toggleNode = async (no, recursivo) => {
      await alternarOriginal(no, recursivo);
      atualizarRotulo();
    };
    const ajustarOriginal = mapa.fit.bind(mapa);
    mapa.fit = async (max) => {
      await ajustarOriginal(max);
      await garantirLegibilidade();
    };
    atualizarRotulo();
  } catch {
    falhou.value = true;
  }
}

async function repintar(): Promise<void> {
  if (!mapa) return;
  mapa.setOptions(opcoes());
  await mapa.renderData();
}

onMounted(() => {
  // A aba monta escondida (v-show): só cria o mapa quando o quadro tem largura real.
  if (typeof ResizeObserver === 'function') {
    observadorTamanho = new ResizeObserver(() => {
      const largura = hospedeiro.value?.clientWidth ?? 0;
      if (largura === 0) return;
      if (!mapa) void criar();
      else if (Math.abs(largura - larguraAnterior) > 1) void mapa.fit();
      larguraAnterior = largura;
    });
    if (hospedeiro.value) observadorTamanho.observe(hospedeiro.value);
  } else {
    void criar();
  }

  observadorTema = new MutationObserver(() => void repintar());
  observadorTema.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-modo-adaptado']
  });
  if (typeof matchMedia === 'function') {
    consultaEscuro = matchMedia('(prefers-color-scheme: dark)');
    consultaEscuro.addEventListener('change', repintar);
  }
});

onBeforeUnmount(() => {
  destruido = true;
  observadorTamanho?.disconnect();
  observadorTema?.disconnect();
  consultaEscuro?.removeEventListener('change', repintar);
  mapa?.destroy();
  mapa = undefined;
});
</script>

<template>
  <div class="mapa-visual">
    <div class="mapa-visual__barra" role="group" aria-label="Controles do mapa">
      <button
        type="button"
        class="mapa-visual__botao mapa-visual__todos"
        :aria-expanded="tudoAberto ? 'true' : 'false'"
        @click="alternarTodos"
      >
        {{ rotuloTodos }}
      </button>
      <button
        type="button"
        class="mapa-visual__botao mapa-visual__centralizar"
        @click="centralizar"
      >
        Centralizar
      </button>
    </div>
    <p class="mapa-visual__ajuda">
      Toque num pensador para abrir o ramo. Arraste para mover e use a roda ou a pinça para o zoom.
    </p>
    <p v-if="falhou" role="alert">Não foi possível carregar o mapa visual. Use "Ver em lista".</p>
    <div ref="hospedeiro" class="mapa-visual__quadro">
      <svg
        ref="svgRef"
        class="mapa-visual__svg"
        role="group"
        aria-label="Mapa mental visual. A versão em lista é o botão Ver em lista."
        @click="aoClicarNoTexto"
      />
    </div>
  </div>
</template>

<style scoped>
.mapa-visual {
  max-width: 100%;
}

.mapa-visual__barra {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2, 0.5rem);
  margin-block: var(--esp-3, 0.75rem);
}

.mapa-visual__botao {
  min-width: max(var(--alvo-toque-minimo, 24px), 44px);
  min-height: max(var(--alvo-toque-minimo, 24px), 44px);
  padding: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  border: var(--cartao-borda, 1px solid var(--cor-borda-forte, #c3bca4));
  border-radius: 999px;
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-primaria, #163a5f);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.mapa-visual__botao:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: var(--foco-deslocamento, 2px);
}

.mapa-visual__ajuda {
  max-width: var(--largura-leitura, 68ch);
  margin-block: 0 var(--esp-3, 0.75rem);
  color: var(--cor-texto-suave, #4a4a4a);
}

.mapa-visual__quadro {
  width: 100%;
  overflow: hidden;
  border: var(--cartao-borda, 1px solid var(--cor-borda, #dcd7c8));
  border-radius: var(--raio-lg, 16px);
  background: var(--cor-fundo-elevado, #fff);
}

.mapa-visual__svg {
  display: block;
  width: 100%;
  height: clamp(380px, 72dvh, 680px);
  /* A página rola com o dedo sobre o mapa na vertical; o resto é do markmap. */
  touch-action: pan-y pinch-zoom;
  cursor: grab;
  --markmap-font: 400 16px/1.3 var(--fonte-texto, Inter, sans-serif);
  --markmap-text-color: var(--cor-texto, #1c1c1c);
  --markmap-circle-open-bg: var(--cor-fundo-elevado, #fff);
  --markmap-a-color: var(--cor-primaria, #163a5f);
  --markmap-a-hover-color: var(--cor-primaria, #163a5f);
}

.mapa-visual__svg:active {
  cursor: grabbing;
}

.mapa-visual__svg :deep(.markmap-foreign) {
  cursor: pointer;
}

.mapa-visual__svg :deep(.markmap-foreign a) {
  text-decoration: underline;
  font-weight: 700;
}

.mapa-visual__svg :deep(.markmap-foreign a:focus-visible) {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .mapa-visual__svg :deep(*) {
    transition: none !important;
  }
}

:root[data-modo-adaptado='on'] .mapa-visual__botao {
  color: #000000;
}
</style>
