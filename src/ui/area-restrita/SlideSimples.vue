<script setup lang="ts">
import type { Slide } from '@/core/restrito/tipos';

/** Versão de contingência de um slide que falhou ao renderizar: texto puro, sem composição. */
defineProps<{ slide: Slide }>();
</script>

<template>
  <article class="ar-slide-simples" data-testid="slide-modo-simples" aria-roledescription="slide">
    <h2 class="ar-slide-simples__titulo">{{ slide.titulo }}</h2>
    <p v-if="slide.subtitulo" class="ar-slide-simples__subtitulo">{{ slide.subtitulo }}</p>
    <ul v-if="slide.itens && slide.itens.length > 0" class="ar-slide-simples__itens">
      <li v-for="(item, i) in slide.itens" :key="i">{{ item }}</li>
    </ul>
    <p v-if="slide.destaque" class="ar-slide-simples__destaque">{{ slide.destaque }}</p>
  </article>
</template>

<style scoped>
/* Palco 1600x900 lógico, como os demais slides: mesmo espaço, sem composição. */
.ar-slide-simples {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 80px 100px;
  background: rgba(21, 28, 39, 0.85);
  color: #e8dcc6;
  font-size: 32px;
  line-height: 1.5;
}
.ar-slide-simples__titulo {
  margin: 0 0 24px;
  font-size: 62px;
  line-height: 1.1;
  color: #ffd98a;
}
.ar-slide-simples__subtitulo,
.ar-slide-simples__destaque {
  margin: 0 0 24px;
}
.ar-slide-simples__itens {
  margin: 0;
  padding-inline-start: 1.2em;
}
</style>
