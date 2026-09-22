<script setup lang="ts">
import { computed } from 'vue';
import type { PerguntaEmbaralhada } from '@/core/quiz/tipos';

const props = defineProps<{
  pergunta: PerguntaEmbaralhada;
  respostaEscolhida: 0 | 1 | 2 | 3 | undefined;
}>();

const emit = defineEmits<{ responder: [0 | 1 | 2 | 3] }>();

const respondida = computed(() => props.respostaEscolhida !== undefined);
const idEnunciado = computed(() => `enunciado-${props.pergunta.id}`);

function escolher(indice: 0 | 1 | 2 | 3): void {
  if (respondida.value) return;
  emit('responder', indice);
}

function classeAlternativa(indice: number): string[] {
  if (!respondida.value) return [];
  if (indice === props.pergunta.indiceCorreto) return ['cartao-pergunta__alt--correta'];
  if (indice === props.respostaEscolhida) return ['cartao-pergunta__alt--incorreta'];
  return [];
}
</script>

<template>
  <article class="cartao-pergunta">
    <h3 :id="idEnunciado" class="cartao-pergunta__enunciado">{{ pergunta.enunciado }}</h3>
    <div role="radiogroup" :aria-labelledby="idEnunciado" class="cartao-pergunta__alternativas">
      <label
        v-for="(alternativa, indice) in pergunta.alternativas"
        :key="indice"
        class="cartao-pergunta__alt"
        :class="classeAlternativa(indice)"
      >
        <input
          type="radio"
          :name="`pergunta-${pergunta.id}`"
          :value="indice"
          :checked="respostaEscolhida === indice"
          :disabled="respondida"
          @change="escolher(indice as 0 | 1 | 2 | 3)"
        />
        <span>{{ alternativa }}</span>
        <span v-if="respondida && indice === pergunta.indiceCorreto" class="cartao-pergunta__marca">
          Correta
        </span>
        <span v-else-if="respondida && indice === respostaEscolhida" class="cartao-pergunta__marca">
          Sua resposta, incorreta
        </span>
      </label>
    </div>
    <p v-if="respondida" class="cartao-pergunta__explicacao" aria-live="polite">
      {{ pergunta.explicacao }}
    </p>
    <p v-if="respondida && pergunta.fonteExtra" class="cartao-pergunta__aviso">
      Esta explicação se apoia em artigo complementar, fora do conjunto-base da disciplina.
    </p>
  </article>
</template>

<style scoped>
.cartao-pergunta {
  border: 1px solid var(--cor-borda, #dcd7c8);
  border-radius: var(--raio-md, 10px);
  padding: var(--esp-5, 1.5rem);
  background: var(--cor-fundo-elevado, #fff);
}

.cartao-pergunta__alternativas {
  display: flex;
  flex-direction: column;
  gap: var(--esp-2, 0.5rem);
}

.cartao-pergunta__alt {
  display: flex;
  align-items: center;
  gap: var(--esp-2, 0.5rem);
  padding: var(--esp-2, 0.5rem);
  border-radius: var(--raio-sm, 6px);
}

.cartao-pergunta__alt--correta {
  background: var(--cor-sucesso-bg, #e8f5e9);
  border: 1px solid var(--cor-sucesso-borda, #6fae74);
}

.cartao-pergunta__alt--incorreta {
  background: var(--cor-erro-bg, #ffebee);
  border: 1px solid var(--cor-erro-borda, #dd9a98);
}

.cartao-pergunta__explicacao {
  margin-top: var(--esp-4, 1rem);
}
</style>
