<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { EquipeRestrita, Slide } from '@/core/restrito/tipos';
import EmblemaGrupo from './EmblemaGrupo.vue';

const props = defineProps<{
  slides: readonly Slide[];
  /** A capa mostra a equipe; o slide em si não repete nomes. */
  equipe: EquipeRestrita;
  /** Sem transição nem brilho animado: modo adaptado ou preferência do sistema. */
  reduzirMovimento: boolean;
}>();

const indice = ref(0);
const mostrarNotas = ref(false);
const telaCheia = ref(false);
const anuncio = ref('');
const deck = ref<HTMLElement>();
const palco = ref<HTMLElement>();

const total = computed(() => props.slides.length);
const slide = computed(() => props.slides[indice.value]!);
const rotuloSlide = computed(() => `Slide ${indice.value + 1} de ${total.value}`);
const apiTelaCheia = computed(
  () => typeof document !== 'undefined' && document.fullscreenEnabled === true
);

function irPara(destino: number): void {
  const novo = Math.min(Math.max(destino, 0), total.value - 1);
  if (novo === indice.value) return;
  indice.value = novo;
  anuncio.value = `${rotuloSlide.value}: ${slide.value.titulo}`;
}

const proximo = (): void => irPara(indice.value + 1);
const anterior = (): void => irPara(indice.value - 1);

async function alternarTelaCheia(): Promise<void> {
  if (apiTelaCheia.value && deck.value) {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await deck.value.requestFullscreen();
      return;
    } catch {
      // Sem permissão da API: cai no modo de tela cheia por CSS abaixo.
    }
  }
  telaCheia.value = !telaCheia.value;
}

function aoMudarTelaCheia(): void {
  telaCheia.value = document.fullscreenElement === deck.value;
}

function aoTeclar(evento: KeyboardEvent): void {
  if (evento.ctrlKey || evento.altKey || evento.metaKey) return;
  const acoes: Record<string, () => void> = {
    ArrowRight: proximo,
    PageDown: proximo,
    ArrowLeft: anterior,
    PageUp: anterior,
    Home: () => irPara(0),
    End: () => irPara(total.value - 1),
    n: () => (mostrarNotas.value = !mostrarNotas.value),
    N: () => (mostrarNotas.value = !mostrarNotas.value),
    f: () => void alternarTelaCheia(),
    F: () => void alternarTelaCheia()
  };
  const acao = acoes[evento.key];
  if (!acao) return;
  evento.preventDefault();
  acao();
}

let inicioToque: number | undefined;
function aoPressionar(evento: PointerEvent): void {
  if (evento.pointerType === 'touch') inicioToque = evento.clientX;
}
function aoSoltar(evento: PointerEvent): void {
  if (inicioToque === undefined) return;
  const delta = evento.clientX - inicioToque;
  inicioToque = undefined;
  if (Math.abs(delta) < 60) return;
  if (delta < 0) proximo();
  else anterior();
}

onMounted(() => document.addEventListener('fullscreenchange', aoMudarTelaCheia));
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', aoMudarTelaCheia));

const CORES_ITEM = ['ciano', 'ouro', 'violeta', 'magenta', 'menta'] as const;
const CORES_COLUNA = ['ciano', 'magenta', 'menta'] as const;
const corDoItem = (i: number): string => CORES_ITEM[i % CORES_ITEM.length]!;
const corDaColuna = (i: number): string => CORES_COLUNA[i % CORES_COLUNA.length]!;
</script>

<template>
  <section class="ar-slides" aria-labelledby="ar-slides-titulo">
    <h2 id="ar-slides-titulo">Slides da apresentação</h2>
    <p class="ar-slides__ajuda">
      Setas, PageDown e PageUp trocam de slide; Home e End vão às pontas; N mostra as notas; F abre
      em tela cheia. No celular, deslize para o lado. Sem som.
    </p>

    <div
      ref="deck"
      class="ar-slides__deck"
      :class="{
        'ar-slides__deck--cheia': telaCheia,
        'ar-slides__deck--sem-movimento': reduzirMovimento
      }"
    >
      <div
        ref="palco"
        class="ar-slides__palco"
        tabindex="0"
        role="group"
        aria-roledescription="apresentação de slides"
        aria-label="Slides. Use as setas do teclado para trocar de slide."
        @keydown="aoTeclar"
        @pointerdown="aoPressionar"
        @pointerup="aoSoltar"
      >
        <Transition name="ar-slide" mode="out-in" :css="!reduzirMovimento">
          <article
            :key="slide.id"
            class="ar-slide"
            :class="`ar-slide--${slide.layout}`"
            aria-roledescription="slide"
            :aria-label="rotuloSlide"
          >
            <span class="ar-slide__trilho" aria-hidden="true" />

            <template v-if="slide.layout === 'capa'">
              <div class="ar-slide__capa-corpo">
                <EmblemaGrupo tamanho="pequeno" />
                <div class="ar-slide__capa-texto">
                  <h3 class="ar-slide__titulo">{{ slide.titulo }}</h3>
                  <p v-if="slide.subtitulo" class="ar-slide__subtitulo">{{ slide.subtitulo }}</p>
                  <p class="ar-slide__equipe-instituicao">{{ equipe.instituicao }}</p>
                  <ul class="ar-slide__equipe" aria-label="Integrantes">
                    <li v-for="nome in equipe.integrantes" :key="nome">{{ nome }}</li>
                  </ul>
                </div>
              </div>
            </template>

            <template v-else-if="slide.layout === 'topicos'">
              <h3 class="ar-slide__titulo">{{ slide.titulo }}</h3>
              <p v-if="slide.subtitulo" class="ar-slide__subtitulo">{{ slide.subtitulo }}</p>
              <ol class="ar-slide__itens">
                <li
                  v-for="(item, i) in slide.itens"
                  :key="i"
                  class="ar-slide__item"
                  :data-cor="corDoItem(i)"
                >
                  {{ item }}
                </li>
              </ol>
            </template>

            <template v-else-if="slide.layout === 'destaque'">
              <h3 class="ar-slide__titulo ar-slide__titulo--olho">{{ slide.titulo }}</h3>
              <blockquote class="ar-slide__destaque">{{ slide.destaque }}</blockquote>
              <p v-if="slide.subtitulo" class="ar-slide__subtitulo">{{ slide.subtitulo }}</p>
            </template>

            <template v-else-if="slide.layout === 'comparativo'">
              <h3 class="ar-slide__titulo">{{ slide.titulo }}</h3>
              <div class="ar-slide__colunas">
                <section
                  v-for="(coluna, i) in slide.colunas"
                  :key="i"
                  class="ar-slide__coluna"
                  :data-cor="corDaColuna(i)"
                >
                  <h4>{{ coluna.titulo }}</h4>
                  <ul>
                    <li v-for="(item, j) in coluna.itens" :key="j">{{ item }}</li>
                  </ul>
                </section>
              </div>
            </template>

            <template v-else>
              <div class="ar-slide__fim">
                <h3 class="ar-slide__titulo">{{ slide.titulo }}</h3>
                <p v-if="slide.subtitulo" class="ar-slide__subtitulo">{{ slide.subtitulo }}</p>
                <ul v-if="slide.itens && slide.itens.length > 0" class="ar-slide__itens-simples">
                  <li v-for="(item, i) in slide.itens" :key="i">{{ item }}</li>
                </ul>
              </div>
            </template>
          </article>
        </Transition>
      </div>

      <div class="ar-slides__barra">
        <div class="ar-slides__progresso" aria-hidden="true">
          <span :style="{ width: `${((indice + 1) / total) * 100}%` }" />
        </div>
        <div class="ar-slides__controles">
          <button
            type="button"
            class="ar-botao"
            data-acao="anterior"
            :aria-disabled="indice === 0 ? 'true' : undefined"
            @click="anterior"
          >
            Anterior
          </button>
          <p class="ar-slides__contador">{{ indice + 1 }} / {{ total }}</p>
          <button
            type="button"
            class="ar-botao"
            data-acao="proximo"
            :aria-disabled="indice === total - 1 ? 'true' : undefined"
            @click="proximo"
          >
            Próximo
          </button>
          <button
            type="button"
            class="ar-botao"
            data-acao="notas"
            :aria-pressed="mostrarNotas ? 'true' : 'false'"
            @click="mostrarNotas = !mostrarNotas"
          >
            Notas do apresentador
          </button>
          <button
            type="button"
            class="ar-botao"
            data-acao="tela-cheia"
            :aria-pressed="telaCheia ? 'true' : 'false'"
            @click="alternarTelaCheia"
          >
            Tela cheia
          </button>
        </div>
      </div>

      <aside v-if="mostrarNotas" class="ar-slides__notas" aria-label="Notas do apresentador">
        <h3>Notas do slide {{ indice + 1 }}</h3>
        <p>{{ slide.notas }}</p>
      </aside>
    </div>

    <p class="ar-visualmente-oculto" role="status" aria-live="polite">{{ anuncio }}</p>
  </section>
</template>

<style scoped>
.ar-slides__ajuda {
  max-width: var(--largura-leitura, 68ch);
  color: var(--cor-texto-suave);
}

.ar-slides__deck {
  --ar-slide-fundo: #0d1118;
  display: grid;
  gap: var(--esp-3, 0.75rem);
  padding: var(--esp-3, 0.75rem);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-lg, 16px);
  background: var(--cor-fundo-elevado);
}

.ar-slides__deck--cheia {
  position: fixed;
  inset: 0;
  z-index: 200;
  align-content: center;
  border-radius: 0;
  overflow: auto;
}

.ar-slides__deck:fullscreen {
  align-content: center;
  border-radius: 0;
  overflow: auto;
}

.ar-slides__palco {
  container-type: inline-size;
  border-radius: var(--raio-md, 10px);
  outline: none;
}

.ar-slides__palco:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco);
  outline-offset: 3px;
}

/* O slide: palco 16:9 com brilho de malha (ciano e violeta), linhas de circuito
   discretas e um trilho de luz. Tudo decorativo (aria-hidden ou fundo). */
.ar-slide {
  position: relative;
  display: grid;
  align-content: center;
  gap: clamp(0.6rem, 2.2cqi, 1.4rem);
  min-height: 24rem;
  padding: clamp(1.1rem, 5cqi, 3.5rem);
  overflow: hidden;
  isolation: isolate;
  color: var(--cor-texto);
  background:
    radial-gradient(60% 85% at 88% 8%, rgb(61 213 243 / 0.22), transparent 62%),
    radial-gradient(55% 75% at 6% 96%, rgb(167 139 250 / 0.2), transparent 62%),
    radial-gradient(40% 55% at 50% 50%, rgb(194 149 100 / 0.07), transparent 70%),
    linear-gradient(160deg, #0d1118 0%, #101a2c 100%);
  border: 1px solid #2b3a52;
  border-radius: var(--raio-md, 10px);
  box-shadow:
    0 0 0 1px rgb(61 213 243 / 0.08) inset,
    0 24px 60px -24px rgb(0 0 0 / 0.8);
}

@container (min-width: 640px) {
  .ar-slide {
    aspect-ratio: 16 / 9;
    min-height: 0;
  }
}

.ar-slide::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    repeating-linear-gradient(0deg, rgb(61 213 243 / 0.05) 0 1px, transparent 1px 44px),
    repeating-linear-gradient(90deg, rgb(61 213 243 / 0.05) 0 1px, transparent 1px 44px);
  mask-image: radial-gradient(90% 90% at 70% 20%, #000, transparent 75%);
  animation: ar-circuito 18s linear infinite;
}

.ar-slide__trilho {
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #3dd5f3, #d9b280, #f0abfc, transparent);
  opacity: 0.9;
}

@keyframes ar-circuito {
  to {
    background-position:
      0 44px,
      44px 0;
  }
}

.ar-slide__titulo {
  margin: 0;
  font-family: var(--fonte-titulo, serif);
  font-size: clamp(1.35rem, 5.4cqi, 3.2rem);
  line-height: 1.12;
  color: var(--ar-ouro-claro, #d9b280);
  overflow-wrap: break-word;
  hyphens: manual;
}

@supports (background-clip: text) or (-webkit-background-clip: text) {
  .ar-slide__titulo {
    background: linear-gradient(95deg, #d9b280 0%, #e8dcc6 45%, #3dd5f3 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}

.ar-slide__titulo--olho {
  font-family: var(--fonte-texto, sans-serif);
  font-size: clamp(0.85rem, 2.2cqi, 1.2rem);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  -webkit-text-fill-color: initial;
  background: none;
  color: var(--ar-ciano, #3dd5f3);
}

.ar-slide__subtitulo {
  margin: 0;
  max-width: 62ch;
  font-size: clamp(0.95rem, 2.5cqi, 1.5rem);
  color: var(--cor-texto-suave);
}

.ar-slide__capa-corpo {
  display: grid;
  gap: clamp(1rem, 4cqi, 2.5rem);
  align-items: center;
}

@container (min-width: 640px) {
  .ar-slide__capa-corpo:has(.ar-emblema) {
    grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
  }
}

.ar-slide__capa-corpo :deep(.ar-emblema img) {
  display: block;
  width: min(100%, 17rem);
  height: auto;
  margin-inline: auto;
  border-radius: 50%;
  box-shadow:
    0 0 0 2px rgb(194 149 100 / 0.8),
    0 0 48px rgb(61 213 243 / 0.35);
}

.ar-slide__capa-texto {
  display: grid;
  gap: clamp(0.4rem, 1.4cqi, 0.9rem);
}

.ar-slide__equipe-instituicao {
  margin: 0.4rem 0 0;
  font-size: clamp(0.8rem, 2cqi, 1.1rem);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ar-ciano, #3dd5f3);
}

.ar-slide__equipe {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: clamp(0.78rem, 1.9cqi, 1rem);
}

.ar-slide__equipe li {
  padding: 0.15rem 0.6rem;
  border: 1px solid rgb(194 149 100 / 0.5);
  border-radius: 999px;
  background: rgb(13 17 24 / 0.6);
}

.ar-slide__itens {
  display: grid;
  gap: clamp(0.5rem, 1.6cqi, 1rem);
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: item;
}

.ar-slide__item {
  --cor-item: #3dd5f3;
  counter-increment: item;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.8rem;
  align-items: center;
  padding: clamp(0.55rem, 1.6cqi, 1rem) clamp(0.7rem, 2cqi, 1.3rem);
  border: 1px solid rgb(255 255 255 / 0.09);
  border-inline-start: 4px solid var(--cor-item);
  border-radius: 10px;
  background: rgb(21 28 39 / 0.72);
  font-size: clamp(0.95rem, 2.5cqi, 1.55rem);
  backdrop-filter: blur(6px);
}

.ar-slide__item::before {
  content: counter(item, decimal-leading-zero);
  font-family: var(--fonte-mono, monospace);
  font-size: 0.8em;
  color: var(--cor-item);
}

.ar-slide__item[data-cor='ouro'] {
  --cor-item: #d9b280;
}
.ar-slide__item[data-cor='violeta'] {
  --cor-item: #a78bfa;
}
.ar-slide__item[data-cor='magenta'] {
  --cor-item: #f0abfc;
}
.ar-slide__item[data-cor='menta'] {
  --cor-item: #6ee7b7;
}

.ar-slide--destaque {
  text-align: center;
  justify-items: center;
}

.ar-slide__destaque {
  margin: 0;
  max-width: 24ch;
  font-family: var(--fonte-titulo, serif);
  font-size: clamp(1.4rem, 6.2cqi, 3.6rem);
  line-height: 1.15;
  color: var(--cor-texto);
  text-wrap: balance;
}

.ar-slide__destaque::before {
  content: '';
  display: block;
  width: 4rem;
  height: 3px;
  margin: 0 auto 1rem;
  background: linear-gradient(90deg, #3dd5f3, #f0abfc);
  border-radius: 2px;
}

.ar-slide__colunas {
  display: grid;
  gap: clamp(0.6rem, 2cqi, 1.2rem);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
}

.ar-slide__coluna {
  --cor-coluna: #3dd5f3;
  padding: clamp(0.7rem, 2cqi, 1.3rem);
  border: 1px solid rgb(255 255 255 / 0.1);
  border-block-start: 3px solid var(--cor-coluna);
  border-radius: 12px;
  background: rgb(21 28 39 / 0.75);
}

.ar-slide__coluna[data-cor='magenta'] {
  --cor-coluna: #f0abfc;
}
.ar-slide__coluna[data-cor='menta'] {
  --cor-coluna: #6ee7b7;
}

.ar-slide__coluna h4 {
  margin: 0 0 0.5rem;
  font-size: clamp(1rem, 2.6cqi, 1.6rem);
  color: var(--cor-coluna);
}

.ar-slide__coluna ul {
  margin: 0;
  padding-inline-start: 1.1rem;
  font-size: clamp(0.9rem, 2.2cqi, 1.35rem);
}

.ar-slide--encerramento {
  text-align: center;
  justify-items: center;
}

.ar-slide__fim {
  display: grid;
  gap: 0.8rem;
  justify-items: center;
  padding: clamp(1rem, 4cqi, 2.5rem);
  border-radius: 999px;
  box-shadow: 0 0 80px rgb(61 213 243 / 0.18) inset;
}

.ar-slide__itens-simples {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: clamp(0.9rem, 2.2cqi, 1.3rem);
  color: var(--cor-texto-suave);
}

.ar-slides__barra {
  display: grid;
  gap: 0.5rem;
}

.ar-slides__progresso {
  height: 4px;
  border-radius: 2px;
  background: var(--cor-borda);
  overflow: hidden;
}

.ar-slides__progresso span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #3dd5f3, #d9b280);
  transition: width 240ms ease;
}

.ar-slides__controles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2, 0.5rem);
  align-items: center;
}

.ar-slides__contador {
  margin: 0;
  min-width: 4.5rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.ar-slides__notas {
  padding: var(--esp-4, 1rem);
  border: 1px dashed var(--cor-borda-forte);
  border-radius: var(--raio-md, 10px);
  background: var(--cor-fundo-sutil);
}

.ar-slides__notas h3 {
  margin-top: 0;
}

.ar-slides__notas p {
  max-width: 70ch;
  margin-bottom: 0;
  font-size: 1.05rem;
  line-height: 1.7;
}

/* Troca de slide: esmaecer e deslizar de leve. */
.ar-slide-enter-active,
.ar-slide-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}
.ar-slide-enter-from {
  opacity: 0;
  transform: translateX(2.5%);
}
.ar-slide-leave-to {
  opacity: 0;
  transform: translateX(-2.5%);
}

@media (prefers-reduced-motion: reduce) {
  .ar-slide::before {
    animation: none;
  }
  .ar-slides__progresso span {
    transition: none;
  }
}

.ar-slides__deck--sem-movimento .ar-slide::before {
  animation: none;
}
.ar-slides__deck--sem-movimento .ar-slides__progresso span {
  transition: none;
}

/* Modo adaptado: preto sobre branco, sem brilho, sem gradiente, bordas de 2px. */
:root[data-modo-adaptado='on'] .ar-slide {
  background: #ffffff;
  color: #000000;
  border: 2px solid #000000;
  box-shadow: none;
}
:root[data-modo-adaptado='on'] .ar-slide::before,
:root[data-modo-adaptado='on'] .ar-slide__trilho {
  display: none;
}
:root[data-modo-adaptado='on'] .ar-slide__titulo,
:root[data-modo-adaptado='on'] .ar-slide__titulo--olho {
  background: none;
  -webkit-text-fill-color: #000000;
  color: #000000;
}
:root[data-modo-adaptado='on'] .ar-slide__subtitulo,
:root[data-modo-adaptado='on'] .ar-slide__equipe-instituicao,
:root[data-modo-adaptado='on'] .ar-slide__itens-simples,
:root[data-modo-adaptado='on'] .ar-slide__destaque,
:root[data-modo-adaptado='on'] .ar-slide__coluna h4 {
  color: #000000;
}
:root[data-modo-adaptado='on'] .ar-slide__item,
:root[data-modo-adaptado='on'] .ar-slide__coluna,
:root[data-modo-adaptado='on'] .ar-slide__equipe li {
  background: #ffffff;
  color: #000000;
  border: 2px solid #000000;
  backdrop-filter: none;
}
:root[data-modo-adaptado='on'] .ar-slide__item::before {
  color: #000000;
}
:root[data-modo-adaptado='on'] .ar-slide__destaque::before {
  background: #000000;
}
:root[data-modo-adaptado='on'] .ar-slide__fim {
  box-shadow: none;
}
:root[data-modo-adaptado='on'] .ar-slide__capa-corpo :deep(.ar-emblema img) {
  box-shadow: none;
  border: 2px solid #000000;
}
:root[data-modo-adaptado='on'] .ar-slides__progresso span {
  background: #000000;
}
:root[data-modo-adaptado='on'] .ar-slide {
  font-size: 1.5rem;
}
:root[data-modo-adaptado='on'] .ar-slide__titulo {
  font-size: 2rem;
}
:root[data-modo-adaptado='on'] .ar-slide__item,
:root[data-modo-adaptado='on'] .ar-slide__coluna ul,
:root[data-modo-adaptado='on'] .ar-slide__subtitulo,
:root[data-modo-adaptado='on'] .ar-slide__itens-simples,
:root[data-modo-adaptado='on'] .ar-slide__equipe {
  font-size: 1.5rem;
}
:root[data-modo-adaptado='on'] .ar-slide__destaque {
  font-size: 2rem;
}

@media print {
  .ar-slides__barra,
  .ar-slides__ajuda {
    display: none;
  }
}
</style>
