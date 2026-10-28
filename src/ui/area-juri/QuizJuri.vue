<script setup lang="ts">
import { computed, ref } from 'vue';
import type { IndiceAlternativa } from '@/core/unidade/tipos';
import type { PerguntaJuri } from '@/core/juri/tipos';
import MotorQuiz from '../componentes/MotorQuiz.vue';
import FontesJuri from './FontesJuri.vue';

const props = defineProps<{ perguntas: readonly PerguntaJuri[] }>();

// Estado só em memória, como no quiz da área restrita: sair da aba zera a rodada.
const novaSemente = (): number => Math.floor(Math.random() * 2 ** 31);
const semente = ref<number | undefined>(novaSemente());
const respostas = ref<Record<number, IndiceAlternativa>>({});
const finalizada = ref(false);

// O motor embaralha e não leva as fontes adiante: a pergunta da vez busca as dela pelo id.
const fontesPorId = computed(() => new Map(props.perguntas.map((p) => [p.id, p.fontes])));

function reiniciar(): void {
  respostas.value = {};
  finalizada.value = false;
  semente.value = novaSemente();
}
</script>

<template>
  <section class="juri-quiz" aria-labelledby="juri-quiz-titulo">
    <h2 id="juri-quiz-titulo">Quiz</h2>
    <MotorQuiz
      :perguntas="perguntas"
      :semente="semente"
      :respostas-salvas="respostas"
      :finalizada="finalizada"
      @semente-gerada="semente = $event"
      @responder="(id, indice) => (respostas = { ...respostas, [id]: indice })"
      @finalizar="finalizada = true"
      @reiniciar="reiniciar"
    >
      <template #apos-pergunta="{ pergunta }">
        <FontesJuri v-if="pergunta" :fontes="fontesPorId.get(pergunta.id) ?? []" />
      </template>
    </MotorQuiz>
  </section>
</template>
