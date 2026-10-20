<script setup lang="ts">
import { legendaDoCalendario } from '@/app/calendario/legendaDoCalendario';

const itens = legendaDoCalendario();
</script>

<template>
  <section class="legenda-calendario" aria-labelledby="legenda-calendario-titulo">
    <h2 id="legenda-calendario-titulo" class="legenda-calendario__titulo">Legenda</h2>
    <ul class="legenda-calendario__lista" data-testid="legenda-calendario">
      <li v-for="item in itens" :key="item.categoria">
        <span class="cal-chip" :class="item.classe">{{ item.rotulo }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.legenda-calendario__titulo {
  font-family: var(--fonte-titulo);
  font-size: var(--escala-md, 1.25rem);
  color: var(--cor-titulo-texto, #0d2440);
  margin: 0 0 var(--esp-2, 0.5rem);
}

.legenda-calendario__lista {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2, 0.5rem);
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
