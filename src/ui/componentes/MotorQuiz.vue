<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PerguntaQuiz } from '@/core/unidade/tipos';
import { embaralharRodada, calcularPontuacao } from '@/app/quiz/motor';
import CartaoPergunta from './CartaoPergunta.vue';
import ResultadoQuiz from './ResultadoQuiz.vue';
import GradeRevisao from './GradeRevisao.vue';
import PlacarQuiz from './PlacarQuiz.vue';

const props = defineProps<{
  perguntas: readonly PerguntaQuiz[];
  /** undefined = ainda não há rodada salva; o componente gera e emite uma. */
  semente: number | undefined;
  respostasSalvas: Readonly<Record<number, 0 | 1 | 2 | 3>>;
  finalizada: boolean;
}>();

const emit = defineEmits<{
  'semente-gerada': [number];
  responder: [number, 0 | 1 | 2 | 3];
  finalizar: [];
  reiniciar: [];
}>();

if (props.semente === undefined) {
  // Semente nova, não Math.random puro: precisa caber em inteiro de 32 bits
  // para o gerador determinístico (core/quiz/motor).
  emit('semente-gerada', Math.floor(Math.random() * 2 ** 31));
}

const sementeEfetiva = computed(() => props.semente ?? 1);
const rodada = computed(() => embaralharRodada(props.perguntas, sementeEfetiva.value));
const indiceAtual = ref(0);
const pontuacao = computed(() => calcularPontuacao(rodada.value.perguntas, props.respostasSalvas));

/**
 * Denominador do placar (ordem do líder, 22/09/2026): quantas perguntas
 * DESTA rodada já têm resposta salva — nunca o total do quiz, que
 * aparece à parte em PlacarQuiz. Escopado à rodada (não
 * Object.keys(respostasSalvas).length cru) pela mesma razão de
 * calcularPontuacao: uma chave estranha no registro não deve contar.
 */
const respondidas = computed(
  () => rodada.value.perguntas.filter((p) => props.respostasSalvas[p.id] !== undefined).length
);

watch(
  () => props.semente,
  () => {
    indiceAtual.value = 0;
  }
);

function irPara(indice: number): void {
  indiceAtual.value = indice;
}

function proxima(): void {
  if (indiceAtual.value < rodada.value.perguntas.length - 1) {
    indiceAtual.value += 1;
  } else {
    emit('finalizar');
  }
}

function anterior(): void {
  if (indiceAtual.value > 0) indiceAtual.value -= 1;
}
</script>

<template>
  <div class="motor-quiz">
    <template v-if="!finalizada">
      <p class="motor-quiz__posicao">
        Pergunta {{ indiceAtual + 1 }} de {{ rodada.perguntas.length }}
      </p>
      <PlacarQuiz
        :acertos="pontuacao.acertos"
        :respondidas="respondidas"
        :total-quiz="rodada.perguntas.length"
      />
      <CartaoPergunta
        v-if="rodada.perguntas[indiceAtual]"
        :pergunta="rodada.perguntas[indiceAtual]!"
        :resposta-escolhida="respostasSalvas[rodada.perguntas[indiceAtual]!.id]"
        @responder="(indice) => emit('responder', rodada.perguntas[indiceAtual]!.id, indice)"
      />
      <div class="motor-quiz__navegacao">
        <button type="button" :disabled="indiceAtual === 0" @click="anterior">Anterior</button>
        <button type="button" @click="proxima">
          {{ indiceAtual === rodada.perguntas.length - 1 ? 'Finalizar' : 'Próxima' }}
        </button>
      </div>
    </template>
    <template v-else>
      <ResultadoQuiz :pontuacao="pontuacao" @reiniciar="emit('reiniciar')" />
      <GradeRevisao
        :perguntas="rodada.perguntas"
        :respostas="respostasSalvas"
        @selecionar="irPara"
      />
    </template>
  </div>
</template>

<style scoped>
.motor-quiz__navegacao {
  display: flex;
  justify-content: space-between;
  margin-top: var(--esp-4, 1rem);
}

.motor-quiz__navegacao button {
  /* Achado 3 da revisão (docs/revisao-modo-adaptado.md): só min-height
     estava fixado; a largura dependia de padding/conteúdo, nunca
     conferida. min-width garante o alvo mínimo (WCAG 2.5.5) mesmo com
     rótulo curto. */
  min-width: 44px;
  min-height: 44px;
  padding: var(--esp-2, 0.5rem) var(--esp-5, 1.5rem);
  border-radius: var(--raio-md, 10px);
  border: 1px solid var(--cor-borda, #dcd7c8);
  background: var(--cor-fundo-elevado, #fff);
  cursor: pointer;
}

@media print {
  .motor-quiz__navegacao {
    display: none;
  }
}
</style>
