<script setup lang="ts">
import type { PerguntaEmbaralhada } from '@/core/quiz/tipos';

const props = defineProps<{
  perguntas: readonly PerguntaEmbaralhada[];
  respostas: Readonly<Record<number, 0 | 1 | 2 | 3>>;
}>();
const emit = defineEmits<{ selecionar: [number] }>();

function estado(pergunta: PerguntaEmbaralhada): 'certa' | 'errada' | 'sem-resposta' {
  const resposta = props.respostas[pergunta.id];
  if (resposta === undefined) return 'sem-resposta';
  return resposta === pergunta.indiceCorreto ? 'certa' : 'errada';
}
</script>

<template>
  <div class="grade-revisao" role="group" aria-label="Grade de revisão do quiz">
    <button
      v-for="(pergunta, indice) in perguntas"
      :key="pergunta.id"
      type="button"
      class="grade-revisao__item"
      :class="`grade-revisao__item--${estado(pergunta)}`"
      :aria-label="`Pergunta ${indice + 1}, ${estado(pergunta) === 'certa' ? 'correta' : estado(pergunta) === 'errada' ? 'incorreta' : 'sem resposta'}`"
      @click="emit('selecionar', indice)"
    >
      {{ indice + 1 }}
    </button>
  </div>
</template>

<style scoped>
.grade-revisao {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: var(--esp-2, 0.5rem);
}

.grade-revisao__item {
  /* Achado 3 da revisão: min-width explícito, não só o piso indireto de
     grid-template-columns (minmax(44px, 1fr) acima). */
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--raio-sm, 6px);
  border: 1px solid var(--cor-borda, #dcd7c8);
  background: var(--cor-fundo-elevado, #fff);
  cursor: pointer;
}

.grade-revisao__item--certa {
  background: var(--cor-sucesso-bg, #e8f5e9);
  border-color: var(--cor-sucesso-borda, #6fae74);
}

.grade-revisao__item--errada {
  background: var(--cor-erro-bg, #ffebee);
  border-color: var(--cor-erro-borda, #dd9a98);
}

@media print {
  .grade-revisao {
    display: none;
  }
}
</style>
