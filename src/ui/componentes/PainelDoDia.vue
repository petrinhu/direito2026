<script setup lang="ts">
import type { VisaoDoDia } from '@/app/calendario/visaoDoDia';

/**
 * Descrições do dia escolhido. aria-live="polite": quando a data muda, o
 * leitor de tela anuncia o novo conteúdo sem roubar o foco.
 */
defineProps<{ visao: VisaoDoDia }>();
</script>

<template>
  <section class="painel-do-dia" data-testid="painel-do-dia" aria-live="polite" aria-atomic="true">
    <h2 class="painel-do-dia__titulo">{{ visao.titulo }}</h2>
    <ul v-if="visao.itens.length > 0" class="painel-do-dia__lista">
      <li v-for="item in visao.itens" :key="item.chave" class="painel-do-dia__item">
        <span class="cal-chip" :class="item.classe">{{ item.rotulo }}</span>
        <strong class="painel-do-dia__evento">{{ item.titulo }}</strong>
        <p class="painel-do-dia__descricao">{{ item.descricao }}</p>
      </li>
    </ul>
    <p v-else class="painel-do-dia__vazio">Nenhuma data marcada neste dia.</p>
  </section>
</template>

<style scoped>
.painel-do-dia {
  margin-top: var(--esp-5, 1.5rem);
  /* Palavra longa sem ponto de quebra (ex.: "Empreendedorismo") na leitura ampliada
     passava da caixa em 320px. "anywhere" vale também para o tamanho mínimo do item
     (justify-items: start dá largura de conteúdo), não só para a quebra de linha. */
  overflow-wrap: anywhere;
  padding: var(--esp-4, 1rem) var(--esp-5, 1.5rem);
  border-radius: var(--raio-lg, 16px);
  border: 1px solid var(--cor-borda, #dcd7c8);
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-texto, #1c1c1c);
}

.painel-do-dia__titulo {
  font-family: var(--fonte-titulo);
  font-size: var(--escala-md, 1.25rem);
  color: var(--cor-titulo-texto, #0d2440);
  margin: 0 0 var(--esp-3, 0.75rem);
}

.painel-do-dia__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--esp-3, 0.75rem);
}

.painel-do-dia__item {
  display: grid;
  min-width: 0;
  gap: var(--esp-1, 0.25rem);
  justify-items: start;
}

.painel-do-dia__descricao {
  margin: 0;
  color: var(--cor-texto-suave, #4a4a4a);
}

.painel-do-dia__vazio {
  margin: 0;
  color: var(--cor-texto-suave, #4a4a4a);
}
</style>
