<script setup lang="ts">
import { computed } from 'vue';
import type { DicasDeForma } from '@/core/unidade/tipos';

/** O texto vem da unidade (resumo.ts, bloco de dicas). Este componente só apresenta. */
const props = defineProps<{ dados: DicasDeForma }>();

/**
 * Cada item é o texto inteiro com um trecho em negrito, achado pelo próprio texto.
 * O <li> do template fica numa linha de propósito: quebra de linha ali entraria
 * como espaço no texto do item.
 */
const itens = computed(() =>
  props.dados.itens.map((item) => {
    const inicio = item.texto.indexOf(item.destaque);
    if (inicio < 0) return { texto: item.texto, antes: item.texto, destaque: '', depois: '' };
    return {
      texto: item.texto,
      antes: item.texto.slice(0, inicio),
      destaque: item.destaque,
      depois: item.texto.slice(inicio + item.destaque.length)
    };
  })
);
</script>

<template>
  <aside class="dicas-forma" aria-label="Dicas de forma anotadas pela professora">
    <h3 class="dicas-forma__titulo">{{ props.dados.titulo }}</h3>
    <ul class="dicas-forma__lista">
      <!-- prettier-ignore -->
      <li v-for="i in itens" :key="i.texto">{{ i.antes }}<strong>{{ i.destaque }}</strong>{{ i.depois }}</li>
    </ul>
  </aside>
</template>

<style scoped>
.dicas-forma {
  max-width: var(--largura-coluna-leitura, 760px);
  margin-block: var(--esp-5, 1.5rem);
  padding: var(--esp-4, 1rem);
  background: var(--cor-acento-claro, #f3ead1);
  color: var(--cor-acento, #8a6d1f);
  border-radius: var(--raio-md, 10px);
}

.dicas-forma__titulo {
  font-family: var(--fonte-titulo);
  font-variant-numeric: lining-nums;
  margin-block-start: 0;
}

.dicas-forma__lista {
  margin: 0;
  padding-inline-start: var(--esp-5, 1.5rem);
}
</style>
