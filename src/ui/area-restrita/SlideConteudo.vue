<script setup lang="ts">
/* global ResizeObserver */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { compor } from '@/app/restrito/palco';
import type { EquipeRestrita, Slide } from '@/core/restrito/tipos';
import { ajustarFonteAoPalco } from './ajusteDeFonte';
import EmblemaGrupo from './EmblemaGrupo.vue';
import './slide-tokens.css';

const props = defineProps<{
  slide: Slide;
  /** A capa mostra a equipe; os demais slides não repetem nomes. */
  equipe: EquipeRestrita;
  rotulo: string;
}>();

const composicao = computed(() => compor(props.slide));
const numeroDoSlide = computed(() => String(props.slide.id).padStart(2, '0'));
const quantidadeNumericos = computed(
  () => composicao.value.itens.filter((i) => i.numero !== undefined).length
);
// Espelha o circuito conforme o id, para slides vizinhos não terem o mesmo desenho.
const espelho = computed(() => props.slide.id % 4);

const raiz = ref<HTMLElement>();
const corpo = ref<HTMLElement>();
let cancelado = false;

function ajustar(): void {
  if (raiz.value && corpo.value) ajustarFonteAoPalco(raiz.value, corpo.value);
}

let observador: ResizeObserver | undefined;
let medidaAnterior = '';

onMounted(() => {
  ajustar();
  // A fonte web chega depois do primeiro layout (e depois de fonts.ready, que pode
  // resolver antes de a fonte ser pedida): refaz o encaixe a cada mudança de tamanho
  // do conteúdo. Mesmo resultado, mesma medida: não entra em laço.
  const conteudo = corpo.value?.querySelector<HTMLElement>('.ar-slide__conteudo');
  if (conteudo && typeof ResizeObserver !== 'undefined') {
    observador = new ResizeObserver(() => {
      const medida = `${conteudo.offsetWidth}x${conteudo.offsetHeight}`;
      if (cancelado || medida === medidaAnterior) return;
      ajustar();
      medidaAnterior = `${conteudo.offsetWidth}x${conteudo.offsetHeight}`;
    });
    observador.observe(conteudo);
  }
  void document.fonts?.ready.then(() => {
    if (!cancelado) ajustar();
  });
  document.fonts?.addEventListener?.('loadingdone', ajustar);
});
onBeforeUnmount(() => {
  cancelado = true;
  observador?.disconnect();
  document.fonts?.removeEventListener?.('loadingdone', ajustar);
});
</script>

<template>
  <article
    ref="raiz"
    class="ar-slide"
    :class="[`ar-slide--${slide.layout}`, `ar-slide--${composicao.tipo}`]"
    :data-acento="composicao.acento"
    aria-roledescription="slide"
    :aria-label="rotulo"
  >
    <svg
      class="ar-slide__circuito"
      :class="`ar-slide__circuito--${espelho}`"
      viewBox="0 0 1600 900"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M0 150 H260 L320 90 H640" />
        <path d="M0 210 H180 L240 270 H420" />
        <path d="M1600 760 H1330 L1270 820 H1000" />
        <path d="M1600 700 H1420 L1360 640 H1180" />
        <path d="M60 900 V760 L120 700 V560" />
      </g>
      <g fill="currentColor">
        <circle cx="640" cy="90" r="7" />
        <circle cx="420" cy="270" r="7" />
        <circle cx="1000" cy="820" r="7" />
        <circle cx="1180" cy="640" r="7" />
        <circle cx="120" cy="560" r="7" />
      </g>
    </svg>
    <span class="ar-slide__trilho" aria-hidden="true" />
    <span class="ar-slide__numero" aria-hidden="true">{{ numeroDoSlide }}</span>

    <div ref="corpo" class="ar-slide__corpo">
      <div class="ar-slide__conteudo">
        <template v-if="slide.layout === 'capa'">
          <div class="ar-slide__capa-corpo">
            <div class="ar-slide__capa-texto">
              <h3 class="ar-slide__titulo" style="--i: 0">{{ slide.titulo }}</h3>
              <p v-if="slide.subtitulo" class="ar-slide__subtitulo" style="--i: 1">
                {{ slide.subtitulo }}
              </p>
              <p class="ar-slide__equipe-instituicao" style="--i: 2">{{ equipe.instituicao }}</p>
              <ul class="ar-slide__equipe" aria-label="Integrantes" style="--i: 3">
                <li v-for="nome in equipe.integrantes" :key="nome">{{ nome }}</li>
              </ul>
            </div>
            <EmblemaGrupo tamanho="capa" />
          </div>
        </template>

        <template v-else-if="slide.layout === 'topicos'">
          <h3 class="ar-slide__titulo" style="--i: 0">{{ slide.titulo }}</h3>
          <p v-if="slide.subtitulo" class="ar-slide__subtitulo" style="--i: 1">
            {{ slide.subtitulo }}
          </p>
          <ol
            class="ar-slide__itens"
            :class="[
              `ar-slide__itens--${composicao.tipo}`,
              { 'ar-slide__itens--compacto': composicao.itens.length > 4 }
            ]"
            :data-n="composicao.itens.length"
            :style="{ '--s-colunas': quantidadeNumericos }"
          >
            <li
              v-for="(item, i) in composicao.itens"
              :key="i"
              class="ar-slide__item"
              :class="{ 'ar-slide__item--numero': item.numero !== undefined }"
              :data-cor="item.cor"
              :style="{ '--i': i + 2 }"
            >
              <span v-if="item.numero" class="ar-slide__contador">{{ item.numero }}</span>
              <span v-if="item.rotulo" class="ar-slide__rotulo">{{ item.rotulo }}</span>
              <span class="ar-slide__corpo-item">{{ item.corpo }}</span>
            </li>
          </ol>
        </template>

        <template v-else-if="slide.layout === 'destaque'">
          <h3 class="ar-slide__titulo ar-slide__titulo--olho" style="--i: 0">
            {{ slide.titulo }}
          </h3>
          <blockquote class="ar-slide__destaque" style="--i: 1">{{ slide.destaque }}</blockquote>
          <p
            v-if="slide.subtitulo"
            class="ar-slide__subtitulo ar-slide__subtitulo--chip"
            style="--i: 2"
          >
            {{ slide.subtitulo }}
          </p>
        </template>

        <template v-else-if="slide.layout === 'comparativo'">
          <h3 class="ar-slide__titulo" style="--i: 0">{{ slide.titulo }}</h3>
          <p v-if="slide.subtitulo" class="ar-slide__subtitulo" style="--i: 1">
            {{ slide.subtitulo }}
          </p>
          <div class="ar-slide__colunas" :data-n="composicao.colunas.length">
            <section
              v-for="(coluna, i) in composicao.colunas"
              :key="i"
              class="ar-slide__coluna"
              :data-cor="coluna.cor"
              :style="{ '--i': i + 2 }"
            >
              <h4>{{ coluna.titulo }}</h4>
              <ul>
                <li v-for="(item, j) in coluna.itens" :key="j">{{ item }}</li>
              </ul>
            </section>
            <span
              v-if="composicao.colunas.length === 2"
              class="ar-slide__versus"
              aria-hidden="true"
            >
              VS
            </span>
          </div>
        </template>

        <template v-else>
          <div class="ar-slide__fim">
            <div class="ar-slide__fim-titulo">
              <h3 class="ar-slide__titulo" style="--i: 0">{{ slide.titulo }}</h3>
              <p v-if="slide.subtitulo" class="ar-slide__subtitulo" style="--i: 1">
                {{ slide.subtitulo }}
              </p>
            </div>
            <ul v-if="slide.itens && slide.itens.length > 0" class="ar-slide__itens-fim">
              <li v-for="(item, i) in slide.itens" :key="i" :style="{ '--i': i + 2 }">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M4 12.5l5 5L20 6.5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* Palco lógico fixo de 1600x900: todas as medidas aqui são px DESTE palco; quem
   escala é o PalcoSlide (transform). Nada de unidade relativa à janela, para o
   slide ter a mesma composição na janela, na tela cheia, no celular e na impressão.
   --s-aj (0,55 a 1) encolhe as fontes se o conteúdo de um slide passar do palco. */
.ar-slide {
  --s-aj: 1;
  --s-acento: var(--s-ciano);
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  isolation: isolate;
  color: var(--s-texto);
  background:
    radial-gradient(55% 80% at 92% 6%, rgb(61 213 243 / 0.22), transparent 62%),
    radial-gradient(50% 70% at 4% 98%, rgb(167 139 250 / 0.22), transparent 62%),
    radial-gradient(35% 50% at 50% 50%, rgb(194 149 100 / 0.07), transparent 70%),
    linear-gradient(160deg, var(--s-fundo) 0%, var(--s-fundo-2) 100%);
  border: 2px solid #2b3a52;
  box-sizing: border-box;
  box-shadow: 0 0 0 1px rgb(61 213 243 / 0.1) inset;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.ar-slide[data-acento='ciano'] {
  --s-acento: var(--s-ciano);
}
.ar-slide[data-acento='turquesa'] {
  --s-acento: var(--s-turquesa);
}
.ar-slide[data-acento='violeta'] {
  --s-acento: var(--s-violeta);
}
.ar-slide[data-acento='magenta'] {
  --s-acento: var(--s-magenta);
}
.ar-slide[data-acento='menta'] {
  --s-acento: var(--s-menta);
}
.ar-slide[data-acento='ambar'] {
  --s-acento: var(--s-ambar);
}
.ar-slide[data-acento='coral'] {
  --s-acento: var(--s-coral);
}

[data-cor='ciano'] {
  --s-cor: var(--s-ciano);
}
[data-cor='turquesa'] {
  --s-cor: var(--s-turquesa);
}
[data-cor='violeta'] {
  --s-cor: var(--s-violeta);
}
[data-cor='magenta'] {
  --s-cor: var(--s-magenta);
}
[data-cor='menta'] {
  --s-cor: var(--s-menta);
}
[data-cor='ambar'] {
  --s-cor: var(--s-ambar);
}
[data-cor='coral'] {
  --s-cor: var(--s-coral);
}
[data-cor='ouro'] {
  --s-cor: var(--s-ouro);
}

/* Malha técnica discreta, estática (animação só de entrada). */
.ar-slide::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    repeating-linear-gradient(0deg, rgb(61 213 243 / 0.05) 0 1px, transparent 1px 50px),
    repeating-linear-gradient(90deg, rgb(61 213 243 / 0.05) 0 1px, transparent 1px 50px);
  mask-image: radial-gradient(90% 90% at 70% 20%, #000, transparent 75%);
}

.ar-slide__circuito {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  color: var(--s-acento);
  opacity: 0.32;
  pointer-events: none;
}
.ar-slide__circuito--1 {
  transform: scaleX(-1);
}
.ar-slide__circuito--2 {
  transform: scale(-1, -1);
}
.ar-slide__circuito--3 {
  transform: scaleY(-1);
}

.ar-slide__trilho {
  position: absolute;
  inset-inline: 0;
  top: 0;
  z-index: 1;
  height: 5px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--s-acento),
    var(--s-ouro),
    var(--s-magenta),
    transparent
  );
}

.ar-slide__numero {
  position: absolute;
  top: 34px;
  right: 70px;
  z-index: 1;
  font-family: var(--fonte-mono, monospace);
  font-size: 150px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: var(--s-acento);
  opacity: 0.24;
  text-shadow:
    0 0 24px var(--s-acento),
    0 0 70px var(--s-acento);
}

.ar-slide__corpo {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: 80px 100px 70px;
}

/* margin-block:auto centraliza e, se transbordar, vira zero (nada some pelo topo). */
.ar-slide__conteudo {
  display: grid;
  gap: calc(26px * var(--s-aj));
  min-height: 0;
  margin-block: auto;
}

/* Entrada: revela por varredura e esmaece. Só opacity e clip-path, que não
   mexem no layout (a medida de transbordo não é enganada). */
@keyframes ar-slide-entra {
  from {
    opacity: 0;
    clip-path: inset(-120px 100% -120px -120px);
  }
  to {
    opacity: 1;
    clip-path: inset(-120px -120px -120px -120px);
  }
}

.ar-slide__titulo,
.ar-slide__subtitulo,
.ar-slide__item,
.ar-slide__coluna,
.ar-slide__destaque,
.ar-slide__equipe-instituicao,
.ar-slide__equipe,
.ar-slide__itens-fim li {
  animation: ar-slide-entra 640ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
  animation-delay: calc(var(--i, 0) * 90ms);
}

@media (prefers-reduced-motion: reduce) {
  .ar-slide__titulo,
  .ar-slide__subtitulo,
  .ar-slide__item,
  .ar-slide__coluna,
  .ar-slide__destaque,
  .ar-slide__equipe-instituicao,
  .ar-slide__equipe,
  .ar-slide__itens-fim li {
    animation: none;
  }
}

.ar-slides__deck--sem-movimento .ar-slide__titulo,
.ar-slides__deck--sem-movimento .ar-slide__subtitulo,
.ar-slides__deck--sem-movimento .ar-slide__item,
.ar-slides__deck--sem-movimento .ar-slide__coluna,
.ar-slides__deck--sem-movimento .ar-slide__destaque,
.ar-slides__deck--sem-movimento .ar-slide__equipe-instituicao,
.ar-slides__deck--sem-movimento .ar-slide__equipe,
.ar-slides__deck--sem-movimento .ar-slide__itens-fim li {
  animation: none;
}

@media print {
  .ar-slide *,
  .ar-slide *::before {
    animation: none !important;
  }
}

.ar-slide__titulo {
  max-width: 1180px;
  margin: 0;
  font-family: var(--fonte-titulo, serif);
  font-size: calc(62px * var(--s-aj));
  line-height: 1.1;
  color: var(--s-ouro);
  overflow-wrap: break-word;
  hyphens: manual;
}

@supports (background-clip: text) or (-webkit-background-clip: text) {
  .ar-slide__titulo {
    background: linear-gradient(95deg, var(--s-ouro) 0%, var(--s-texto) 45%, var(--s-acento) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}

.ar-slide__titulo--olho {
  font-family: var(--fonte-texto, sans-serif);
  font-size: calc(28px * var(--s-aj));
  letter-spacing: 0.18em;
  text-transform: uppercase;
  background: none;
  -webkit-text-fill-color: initial;
  color: var(--s-acento);
}

.ar-slide__subtitulo {
  max-width: 1150px;
  margin: 0;
  font-size: calc(32px * var(--s-aj));
  line-height: 1.3;
  color: var(--s-texto-suave);
}

.ar-slide__subtitulo--chip {
  justify-self: center;
  padding: 10px 28px;
  border: 2px solid var(--s-acento);
  border-radius: 999px;
  background: rgb(13 17 24 / 0.7);
  color: var(--s-texto);
}

/* Capa: texto à esquerda, emblema grande à direita (some sem arquivos). */
.ar-slide__capa-corpo {
  display: grid;
  gap: 60px;
  align-items: center;
}
.ar-slide__capa-corpo:has(.ar-emblema) {
  grid-template-columns: minmax(0, 1fr) 500px;
}
.ar-slide--capa .ar-slide__titulo {
  max-width: none;
  font-size: calc(76px * var(--s-aj));
}
.ar-slide--capa .ar-slide__subtitulo {
  font-size: calc(36px * var(--s-aj));
}
.ar-slide__capa-texto {
  display: grid;
  gap: calc(22px * var(--s-aj));
}
.ar-slide__capa-corpo :deep(.ar-emblema img) {
  display: block;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  box-shadow:
    0 0 0 4px rgb(194 149 100 / 0.85),
    0 0 90px rgb(61 213 243 / 0.45),
    0 0 180px rgb(167 139 250 / 0.25);
}
.ar-slide__equipe-instituicao {
  margin: 10px 0 0;
  font-size: calc(26px * var(--s-aj));
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--s-ciano);
}
.ar-slide__equipe {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: calc(24px * var(--s-aj));
}
.ar-slide__equipe li {
  padding: 4px 18px;
  border: 2px solid rgb(194 149 100 / 0.55);
  border-radius: 999px;
  background: rgb(13 17 24 / 0.65);
}

/* Itens (tópicos): cada composição tem o seu desenho. */
.ar-slide__itens {
  display: grid;
  gap: calc(18px * var(--s-aj));
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: item;
}
.ar-slide__item {
  --s-cor: var(--s-ciano);
  counter-increment: item;
  position: relative;
  padding: calc(18px * var(--s-aj)) calc(26px * var(--s-aj));
  border: 1px solid rgb(255 255 255 / 0.1);
  border-inline-start: 6px solid var(--s-cor);
  border-radius: 14px;
  background: rgb(21 28 39 / 0.8);
  font-size: calc(32px * var(--s-aj));
  line-height: 1.3;
}
.ar-slide__corpo-item {
  display: block;
}

/* estatísticas: contadores grandes; itens sem número viram faixas. */
.ar-slide__itens--estatisticas {
  grid-template-columns: repeat(var(--s-colunas, 3), minmax(0, 1fr));
}
.ar-slide__itens--estatisticas .ar-slide__item {
  grid-column: 1 / -1;
  font-size: calc(28px * var(--s-aj));
}
.ar-slide__itens--estatisticas .ar-slide__item--numero {
  grid-column: auto;
  display: grid;
  gap: 6px;
  align-content: start;
  border-inline-start-width: 1px;
  border-block-start: 6px solid var(--s-cor);
  background:
    radial-gradient(
      90% 70% at 50% 0%,
      color-mix(in srgb, var(--s-cor) 22%, transparent),
      transparent 70%
    ),
    rgb(21 28 39 / 0.85);
  text-align: center;
}
.ar-slide__contador {
  font-family: var(--fonte-mono, monospace);
  font-size: calc(120px * var(--s-aj));
  font-weight: 700;
  line-height: 1;
  color: var(--s-cor);
  text-shadow: 0 0 36px color-mix(in srgb, var(--s-cor) 70%, transparent);
}

/* trilhas: rótulo em etiqueta colorida, texto ao lado. */
.ar-slide__itens--trilhas .ar-slide__item {
  display: grid;
  grid-template-columns: 330px minmax(0, 1fr);
  gap: 28px;
  align-items: center;
}
.ar-slide__rotulo {
  font-family: var(--fonte-mono, monospace);
  font-size: max(23px, 0.78em);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--s-cor);
}
.ar-slide__itens--trilhas .ar-slide__rotulo {
  padding: 8px 16px;
  border: 2px solid var(--s-cor);
  border-radius: 10px;
  background: color-mix(in srgb, var(--s-cor) 12%, transparent);
  text-align: center;
}

/* Mais de 4 itens: cartões compactos (a lista cresce, o palco não). */
.ar-slide__itens--compacto {
  gap: calc(12px * var(--s-aj));
}
.ar-slide__itens--compacto .ar-slide__item {
  padding: calc(11px * var(--s-aj)) calc(22px * var(--s-aj));
  line-height: 1.2;
}

/* mosaico: cartões em grade, rótulo como cabeça. */
.ar-slide__itens--mosaico {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}
.ar-slide__itens--mosaico .ar-slide__item {
  grid-column: span 2;
  display: grid;
  gap: 10px;
  align-content: start;
  border-inline-start-width: 1px;
  border-block-start: 6px solid var(--s-cor);
  font-size: calc(27px * var(--s-aj));
}
.ar-slide__itens--mosaico[data-n='4'] .ar-slide__item,
.ar-slide__itens--mosaico[data-n='2'] .ar-slide__item {
  grid-column: span 3;
}
.ar-slide__itens--mosaico[data-n='5'] .ar-slide__item:nth-child(n + 4) {
  grid-column: span 3;
}

/* linha do tempo: condutor vertical com nós numerados. */
.ar-slide__itens--linha {
  position: relative;
  gap: calc(16px * var(--s-aj));
  padding-inline-start: 86px;
}
.ar-slide__itens--linha::before {
  content: '';
  position: absolute;
  inset-block: 14px;
  inset-inline-start: 31px;
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--s-acento), var(--s-violeta), var(--s-magenta));
}
.ar-slide__itens--linha .ar-slide__item {
  border-inline-start-width: 1px;
  font-size: calc(31px * var(--s-aj));
}
.ar-slide__itens--linha .ar-slide__item::before {
  content: counter(item, decimal-leading-zero);
  position: absolute;
  inset-inline-start: -86px;
  top: 50%;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-top: -32px;
  border: 3px solid var(--s-cor);
  border-radius: 50%;
  background: var(--s-fundo);
  font-family: var(--fonte-mono, monospace);
  font-size: 26px;
  font-weight: 700;
  color: var(--s-cor);
  box-shadow: 0 0 22px color-mix(in srgb, var(--s-cor) 55%, transparent);
}

/* grade: o primeiro item é o principal. */
.ar-slide__itens--grade {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.ar-slide__itens--grade .ar-slide__item::before {
  content: counter(item, decimal-leading-zero);
  display: block;
  margin-bottom: 6px;
  font-family: var(--fonte-mono, monospace);
  font-size: 0.7em;
  font-weight: 700;
  color: var(--s-cor);
}
.ar-slide__itens--grade .ar-slide__item:first-child {
  grid-column: 1 / -1;
  font-size: calc(38px * var(--s-aj));
  background:
    linear-gradient(100deg, color-mix(in srgb, var(--s-cor) 20%, transparent), transparent 60%),
    rgb(21 28 39 / 0.85);
}

/* destaque: a frase ocupa o palco. */
.ar-slide--destaque .ar-slide__conteudo {
  justify-items: center;
  text-align: center;
}
.ar-slide--destaque .ar-slide__conteudo::before {
  content: '\201C';
  position: absolute;
  top: 70px;
  left: 90px;
  z-index: -1;
  font-family: var(--fonte-titulo, serif);
  font-size: 520px;
  line-height: 1;
  color: var(--s-acento);
  opacity: 0.16;
}
.ar-slide__destaque {
  max-width: 1300px;
  margin: 0;
  font-family: var(--fonte-titulo, serif);
  font-size: calc(66px * var(--s-aj));
  line-height: 1.16;
  color: var(--s-texto);
  text-wrap: balance;
  text-shadow: 0 0 40px color-mix(in srgb, var(--s-acento) 45%, transparent);
}
.ar-slide__destaque::before {
  content: '';
  display: block;
  width: 120px;
  height: 5px;
  margin: 0 auto 28px;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--s-ciano), var(--s-magenta));
}

/* comparativo. */
.ar-slide__colunas {
  position: relative;
  display: grid;
  gap: calc(28px * var(--s-aj));
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  grid-auto-flow: column;
}
.ar-slide__coluna {
  --s-cor: var(--s-ciano);
  padding: calc(24px * var(--s-aj)) calc(28px * var(--s-aj));
  border: 1px solid rgb(255 255 255 / 0.12);
  border-block-start: 6px solid var(--s-cor);
  border-radius: 16px;
  background:
    radial-gradient(
      80% 50% at 50% 0%,
      color-mix(in srgb, var(--s-cor) 18%, transparent),
      transparent 75%
    ),
    rgb(21 28 39 / 0.85);
}
.ar-slide__coluna h4 {
  margin: 0 0 calc(14px * var(--s-aj));
  font-size: calc(32px * var(--s-aj));
  line-height: 1.2;
  color: var(--s-cor);
}
.ar-slide__coluna ul {
  display: grid;
  gap: calc(10px * var(--s-aj));
  margin: 0;
  padding-inline-start: 1.1em;
  font-size: calc(25px * var(--s-aj));
  line-height: 1.3;
}
.ar-slide__coluna li::marker {
  color: var(--s-cor);
}
.ar-slide__colunas[data-n='2'] .ar-slide__coluna ul {
  font-size: calc(29px * var(--s-aj));
}
.ar-slide__versus {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  margin: -42px 0 0 -42px;
  border: 3px solid var(--s-ouro);
  border-radius: 50%;
  background: var(--s-fundo);
  font-family: var(--fonte-mono, monospace);
  font-size: 28px;
  font-weight: 700;
  color: var(--s-ouro);
  box-shadow: 0 0 36px rgb(217 178 128 / 0.5);
}

/* encerramento: texto grande, alto contraste. */
.ar-slide__fim {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.25fr);
  gap: 70px;
  align-items: center;
}
.ar-slide__fim-titulo {
  display: grid;
  gap: calc(24px * var(--s-aj));
}
.ar-slide--encerramento .ar-slide__titulo {
  font-size: calc(84px * var(--s-aj));
}
.ar-slide--encerramento .ar-slide__subtitulo {
  font-size: calc(36px * var(--s-aj));
  color: var(--s-texto);
}
.ar-slide__itens-fim {
  display: grid;
  gap: calc(14px * var(--s-aj));
  margin: 0;
  padding: 0;
  list-style: none;
}
.ar-slide__itens-fim li {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  padding: calc(14px * var(--s-aj)) calc(22px * var(--s-aj));
  border: 1px solid rgb(110 231 183 / 0.35);
  border-radius: 14px;
  background: rgb(16 40 31 / 0.55);
  font-size: calc(30px * var(--s-aj));
  line-height: 1.25;
  color: var(--s-texto);
}
.ar-slide__itens-fim svg {
  width: 40px;
  height: 40px;
  color: var(--s-menta);
  filter: drop-shadow(0 0 8px rgb(110 231 183 / 0.6));
}
</style>
