<script setup lang="ts">
import type { Pontuacao } from '@/core/quiz/tipos';

defineProps<{ pontuacao: Pontuacao }>();
const emit = defineEmits<{ reiniciar: [] }>();

const ROTULOS_CATEGORIA: Record<string, string> = {
  teoria: 'Teoria',
  peticao: 'Petição',
  fundamentos: 'Fundamentos'
};
</script>

<template>
  <section class="resultado-quiz" aria-label="Resultado do quiz">
    <h2>Resultado: {{ pontuacao.acertos }} de {{ pontuacao.total }}</h2>
    <ul class="resultado-quiz__categorias">
      <li v-for="categoria in pontuacao.porCategoria" :key="categoria.categoria">
        {{ ROTULOS_CATEGORIA[categoria.categoria] ?? categoria.categoria }}:
        {{ categoria.acertos }} de {{ categoria.total }}
      </li>
    </ul>
    <button type="button" class="resultado-quiz__reiniciar" @click="emit('reiniciar')">
      Refazer o quiz
    </button>
  </section>
</template>

<style scoped>
.resultado-quiz__categorias {
  list-style: none;
  padding: 0;
  display: flex;
  gap: var(--esp-4, 1rem);
  flex-wrap: wrap;
}

.resultado-quiz__reiniciar {
  min-height: 44px;
  padding: var(--esp-2, 0.5rem) var(--esp-5, 1.5rem);
  background: var(--cor-primaria, #163a5f);
  color: var(--cor-texto-invertido, #faf9f5);
  border: none;
  border-radius: var(--raio-md, 10px);
  cursor: pointer;
}

@media print {
  .resultado-quiz__reiniciar {
    display: none;
  }
}
</style>
