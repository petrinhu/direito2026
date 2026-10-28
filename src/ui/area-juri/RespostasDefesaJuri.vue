<script setup lang="ts">
import type { ItemRespostaDefesa } from '@/core/juri/tipos';
import FontesJuri from './FontesJuri.vue';

defineProps<{ itens: readonly ItemRespostaDefesa[] }>();
</script>

<template>
  <section class="juri-defesa" aria-labelledby="juri-defesa-titulo">
    <h2 id="juri-defesa-titulo">Perguntas da defesa</h2>
    <article v-for="item in itens" :key="item.id" class="juri-defesa__item">
      <dl>
        <dt>Tese da defesa</dt>
        <dd v-html="item.teseHtml" />
        <dt>Resposta</dt>
        <dd v-html="item.respostaHtml" />
        <dt>Limite da resposta</dt>
        <dd v-html="item.limiteHtml" />
      </dl>
      <FontesJuri :fontes="item.fontes" />
    </article>
  </section>
</template>
