<script setup lang="ts">
import { computed } from 'vue';

/**
 * Placar corrente do quiz, visível em toda pergunta (ordem do líder,
 * 22/09/2026, verbatim: "Faltou no quiz um placar a cada uma das
 * perguntas, com / acertos x de y / falhas z de y"). Os números vêm do
 * estado do quiz (MotorQuiz.vue): `respondidas` é quantas perguntas já
 * têm resposta salva, o mesmo denominador das duas linhas; `falhas` é
 * derivado aqui (respondidas - acertos), nunca recebido pronto, para não
 * existir um segundo lugar onde os dois números possam divergir.
 */
const props = defineProps<{
  acertos: number;
  respondidas: number;
  /** Tamanho total do quiz, mostrado à parte do denominador do placar. */
  totalQuiz: number;
}>();

const falhas = computed(() => props.respondidas - props.acertos);
</script>

<template>
  <div class="placar-quiz" role="status" aria-live="polite" aria-atomic="true">
    <p class="placar-quiz__linha placar-quiz__linha--acertos">
      Acertos: <strong>{{ acertos }}</strong> de {{ respondidas }}
    </p>
    <p class="placar-quiz__linha placar-quiz__linha--falhas">
      Falhas: <strong>{{ falhas }}</strong> de {{ respondidas }}
    </p>
    <p class="placar-quiz__total">Quiz com {{ totalQuiz }} perguntas no total.</p>
  </div>
</template>

<style scoped>
.placar-quiz {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-3, 0.75rem);
  align-items: baseline;
  margin-bottom: var(--esp-4, 1rem);
}

.placar-quiz__linha {
  margin: 0;
  padding: var(--esp-1, 0.25rem) var(--esp-3, 0.75rem);
  border-radius: var(--raio-sm, 6px);
  font-size: var(--escala-sm, 0.9375rem);
}

/* Par gêmeo de CartaoPergunta.vue/GradeRevisao.vue (mesmas variáveis de
   acerto/erro), medido no portão de contraste
   (design.contrasteTokens.spec.ts, pares 'marcador de lido (sucesso)' e
   'marcador de erro (placar do quiz)'). Nunca só cor: o texto "Acertos"/
   "Falhas" já distingue por si, cor é reforço, não único canal. */
.placar-quiz__linha--acertos {
  color: var(--cor-sucesso-texto, #1b4620);
  background: var(--cor-sucesso-bg, #e8f5e9);
}

.placar-quiz__linha--falhas {
  color: var(--cor-erro-texto, #611b1b);
  background: var(--cor-erro-bg, #ffebee);
}

.placar-quiz__total {
  margin: 0;
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-texto-suave, #4a4a4a);
}
</style>
