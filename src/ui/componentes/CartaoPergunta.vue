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

/**
 * A alternativa fica dentro de um <label> (o clique nele escolhe a
 * resposta, via o <input> associado). Quando a alternativa carrega um
 * botão de citação (achado ao corrigir a marcação crua, 22/09/2026: pelo
 * menos uma alternativa real tem isso), um clique NELE não pode também
 * forçar essa alternativa como escolhida — o leitor só queria ver a
 * citação. Só o clique dentro do próprio botão de citação para a
 * propagação; clicar no resto do texto da alternativa continua
 * escolhendo, como sempre.
 */
function pararPropagacaoSeCitacao(evento: MouseEvent): void {
  if ((evento.target as HTMLElement).closest?.('button.citacao')) {
    evento.stopPropagation();
  }
}
</script>

<template>
  <article class="cartao-pergunta">
    <!-- v-html só recebe enunciadoHtml/alternativasHtml/explicacaoHtml, que
         vêm de src/conteudo/ (seção 4.4): legitimamente carregam o botão
         de citação (seção 12.1), então `{{ }}` (que escapa HTML) mostrava
         a marcação crua na tela — achado do QA, 22/09/2026. -->
    <h3 :id="idEnunciado" class="cartao-pergunta__enunciado" v-html="pergunta.enunciadoHtml" />
    <div role="radiogroup" :aria-labelledby="idEnunciado" class="cartao-pergunta__alternativas">
      <label
        v-for="(alternativaHtml, indice) in pergunta.alternativasHtml"
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
        <span v-html="alternativaHtml" @click="pararPropagacaoSeCitacao" />
        <span v-if="respondida && indice === pergunta.indiceCorreto" class="cartao-pergunta__marca">
          Correta
        </span>
        <span v-else-if="respondida && indice === respostaEscolhida" class="cartao-pergunta__marca">
          Sua resposta, incorreta
        </span>
      </label>
    </div>
    <p
      v-if="respondida"
      class="cartao-pergunta__explicacao"
      aria-live="polite"
      v-html="pergunta.explicacaoHtml"
    />
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

/* Mesma regra de BlocoTeorico.vue: botão de citação embutido no
   enunciado, na alternativa ou na explicação (achado do QA, 22/09/2026,
   ao corrigir a marcação crua). */
.cartao-pergunta :deep(button.citacao) {
  background: none;
  border: none;
  border-bottom: 1px dashed var(--cor-primaria, #163a5f);
  color: var(--cor-primaria, #163a5f);
  font: inherit;
  cursor: pointer;
  padding: 0;
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
  /* Fora do modo adaptado, --cartao-alt-correta-borda não existe: a
     segunda alternativa dentro de var() é o valor de sempre. Dentro do
     modo, tokens.css redefine para borda dupla sólida 3px preta (seção 3
     da especificação): cor deixa de ser o sinal, a espessura/estilo da
     borda também diferencia acerto de erro em escala de cinza. */
  border: var(--cartao-alt-correta-borda, 1px solid var(--cor-sucesso-borda, #6fae74));
}

.cartao-pergunta__alt--incorreta {
  background: var(--cor-erro-bg, #ffebee);
  border: var(--cartao-alt-incorreta-borda, 1px solid var(--cor-erro-borda, #dd9a98));
}

.cartao-pergunta__explicacao {
  margin-top: var(--esp-4, 1rem);
}
</style>
