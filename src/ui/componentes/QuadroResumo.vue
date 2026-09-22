<script setup lang="ts">
defineProps<{ itens: readonly string[] }>();
</script>

<template>
  <aside class="quadro-resumo" aria-label="Quadro-resumo de revisão">
    <h4>Quadro-resumo</h4>
    <ul>
      <li v-for="(item, indice) in itens" :key="indice">{{ item }}</li>
    </ul>
  </aside>
</template>

<style scoped>
.quadro-resumo {
  background: var(--cor-fundo-sutil, #f2efe6);
  border-left: 3px solid var(--cor-acento, #8a6d1f);
  border-radius: var(--raio-sm, 6px);
  padding: var(--esp-4, 1rem);
  margin-block: var(--esp-4, 1rem);
  break-inside: avoid;
  page-break-inside: avoid;
}

.quadro-resumo h4 {
  margin-top: 0;
}
</style>
