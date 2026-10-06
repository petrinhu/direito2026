<script setup lang="ts">
import type { EquipeRestrita, Slide } from '@/core/restrito/tipos';
import EmblemaGrupo from './EmblemaGrupo.vue';

defineProps<{
  slide: Slide;
  /** A capa mostra a equipe; os demais slides não repetem nomes. */
  equipe: EquipeRestrita;
  rotulo: string;
}>();

const CORES_ITEM = ['ciano', 'ouro', 'violeta', 'magenta', 'menta'] as const;
const CORES_COLUNA = ['ciano', 'magenta', 'menta'] as const;
const corDoItem = (i: number): string => CORES_ITEM[i % CORES_ITEM.length]!;
const corDaColuna = (i: number): string => CORES_COLUNA[i % CORES_COLUNA.length]!;
</script>

<template>
  <article
    class="ar-slide"
    :class="`ar-slide--${slide.layout}`"
    aria-roledescription="slide"
    :aria-label="rotulo"
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
</template>

<style scoped>
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

@media (prefers-reduced-motion: reduce) {
  .ar-slide::before {
    animation: none;
  }
}

.ar-slides__deck--sem-movimento .ar-slide::before {
  animation: none;
}
</style>
