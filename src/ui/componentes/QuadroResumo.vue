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

/* Modo de leitura adaptada, achado ao medir o critério 2 da especificação
   (viewport 320px, nenhuma rolagem horizontal): a fonte maior do modo, em
   itens de lista já apertados pela coluna estreita, empurra algum trecho
   sem ponto de quebra disponível para fora da caixa (scrollWidth maior
   que clientWidth no <li>, sem aumentar a própria caixa: sobra visual, não
   captada por um elemento "largo demais"). overflow-wrap garante que
   qualquer trecho sem espaço de sobra sempre quebre dentro da caixa, em
   vez de vazar para a página. */
:root[data-modo-adaptado='on'] .quadro-resumo li {
  overflow-wrap: anywhere;
}
</style>
