<script setup lang="ts">
/** Texto puro, sempre como `{{ }}`: referência nunca vai para v-html. */
defineProps<{ itens: readonly string[] }>();
</script>

<template>
  <section
    v-if="itens.length > 0"
    class="juri-referencias"
    aria-labelledby="juri-referencias-titulo"
  >
    <h2 id="juri-referencias-titulo">Referências</h2>
    <ul class="juri-referencias__lista">
      <li v-for="(item, indice) in itens" :key="indice">{{ item }}</li>
    </ul>
  </section>
</template>
