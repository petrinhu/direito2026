<script setup lang="ts">
defineProps<{ lidos: number; total: number }>();
</script>

<template>
  <div class="indicador-progresso">
    <p class="indicador-progresso__texto">{{ lidos }} de {{ total }} blocos lidos</p>
    <div
      role="progressbar"
      :aria-valuenow="lidos"
      :aria-valuemin="0"
      :aria-valuemax="total"
      class="indicador-progresso__trilha"
    >
      <div
        class="indicador-progresso__barra"
        :style="{ width: total > 0 ? `${(lidos / total) * 100}%` : '0%' }"
      />
    </div>
  </div>
</template>

<style scoped>
.indicador-progresso__texto {
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-texto-suave, #4a4a4a);
  margin: 0 0 var(--esp-2, 0.5rem);
}

.indicador-progresso__trilha {
  height: 6px;
  border-radius: 999px;
  background: var(--cor-fundo-sutil, #f2efe6);
  overflow: hidden;
}

.indicador-progresso__barra {
  height: 100%;
  background: var(--cor-primaria, #163a5f);
  transition: width var(--transicao-rapida, 150ms ease);
}

@media (prefers-reduced-motion: reduce) {
  .indicador-progresso__barra {
    transition: none;
  }
}
</style>
