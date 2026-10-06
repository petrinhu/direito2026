<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { IndiceAlternativa, PerguntaEmbaralhada } from '@/core/quiz/tipos';
import { rotuloAlternativa, mostrarLetras } from '@/app/quiz/rotuloAlternativa';

const props = defineProps<{
  pergunta: PerguntaEmbaralhada;
  respostaEscolhida: IndiceAlternativa | undefined;
  /** Força as letras A, B, C... mesmo com quatro alternativas (área restrita). */
  letras?: boolean;
}>();

const emit = defineEmits<{ responder: [IndiceAlternativa] }>();

const respondida = computed(() => props.respostaEscolhida !== undefined);
const idEnunciado = computed(() => `enunciado-${props.pergunta.id}`);

const ehVerdadeiroOuFalso = computed(() => props.pergunta.tipo === 'verdadeiro-ou-falso');

const comLetras = computed(
  () => props.letras === true || mostrarLetras(props.pergunta.alternativasHtml.length)
);

const resultadoRef = ref<HTMLElement | undefined>();
// Só a resposta dada AGORA move o foco; abrir uma pergunta já respondida não.
let focoPendente = false;

const acertou = computed(() => props.respostaEscolhida === props.pergunta.indiceCorreto);

/**
 * Responder desabilita os radios e o foco caía em <body>. O foco vai para o
 * bloco do resultado (tabindex -1): o leitor anuncia o veredito e a
 * explicação, e o próximo Tab segue para o que vem depois do cartão.
 */
watch(respondida, async (agora) => {
  if (!agora || !focoPendente) return;
  focoPendente = false;
  await nextTick();
  resultadoRef.value?.focus();
});

function escolher(indice: IndiceAlternativa): void {
  if (respondida.value) return;
  focoPendente = true;
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
  <article
    class="cartao-pergunta"
    :class="{ 'cartao-pergunta--verdadeiro-ou-falso': ehVerdadeiroOuFalso }"
  >
    <!-- Texto, nunca só cor: no modo adaptado o selo perde o fundo colorido
         e continua aqui, como palavra, com borda (tokens.css). -->
    <p v-if="pergunta.origem === 'professor'" class="cartao-pergunta__selo-professor">
      Revisão do professor
    </p>
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
        :class="[classeAlternativa(indice), { 'cartao-pergunta__alt--com-letra': comLetras }]"
      >
        <input
          type="radio"
          :name="`pergunta-${pergunta.id}`"
          :value="indice"
          :checked="respostaEscolhida === indice"
          :disabled="respondida"
          @change="escolher(indice as IndiceAlternativa)"
        />
        <span v-if="comLetras" class="cartao-pergunta__letra">{{ rotuloAlternativa(indice) }}</span>
        <span
          class="cartao-pergunta__alt-texto"
          v-html="alternativaHtml"
          @click="pararPropagacaoSeCitacao"
        />
        <span v-if="respondida && indice === pergunta.indiceCorreto" class="cartao-pergunta__marca">
          Correta
        </span>
        <span v-else-if="respondida && indice === respostaEscolhida" class="cartao-pergunta__marca">
          Sua resposta, incorreta
        </span>
      </label>
    </div>
    <div v-if="respondida" ref="resultadoRef" class="cartao-pergunta__resultado" tabindex="-1">
      <p class="cartao-pergunta__veredito">
        {{ acertou ? 'Resposta correta.' : 'Resposta incorreta.' }}
      </p>
      <p class="cartao-pergunta__explicacao" v-html="pergunta.explicacaoHtml" />
      <p v-if="pergunta.gabaritoDoCaderno" class="cartao-pergunta__nota-caderno">
        Esta resposta vem do caderno de estudo; não é o gabarito oficial da professora.
      </p>
      <p v-if="pergunta.fonteExtra" class="cartao-pergunta__aviso">
        Esta explicação se apoia em artigo complementar, fora do conjunto-base da disciplina.
      </p>
    </div>
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

.cartao-pergunta__enunciado {
  /* Mesma insurança do texto de alternativa acima: enunciado também vem
     de conteúdo (v-html) e pode conter um token longo sem espaço. */
  overflow-wrap: anywhere;
}

.cartao-pergunta__alternativas {
  display: flex;
  flex-direction: column;
  gap: var(--esp-2, 0.5rem);
}

/*
  Grade, não linha flex (achado CRÍTICO 1 de docs/qa-sociologia-u1.md): com
  radio, letra, texto e marca ("Correta" / "Sua resposta, incorreta") na
  mesma linha, a marca e a letra tomavam a largura toda em tela estreita
  com o modo adaptado, e o texto da alternativa ficava com 16px, quebrando
  letra por letra. Agora o texto tem a coluna 1fr só para ele (minmax(0, 1fr)
  deixa encolher e quebrar sem estourar) e a marca desce para a linha de
  baixo, na mesma coluna do texto, sempre dentro do mesmo <label>.
*/
.cartao-pergunta__alt {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: var(--esp-2, 0.5rem);
  row-gap: var(--esp-1, 0.25rem);
  padding: var(--esp-2, 0.5rem);
  border-radius: var(--raio-sm, 6px);
}

.cartao-pergunta__alt--com-letra {
  grid-template-columns: auto auto minmax(0, 1fr);
}

/* Sempre a última coluna (a do texto), com ou sem letra. */
.cartao-pergunta__marca {
  grid-column: -2 / -1;
  min-width: 0;
  overflow-wrap: anywhere;
}

/*
  Achado do QA (docs/qa-redacao-u1.md, "Rodada final"): em 360px, 2 de 10
  cargas do quiz estouravam a largura da página (80px numa pergunta com
  alternativas em lista separada por vírgula, 13px noutra) — intermitente
  porque o quiz sorteia a ordem a cada carga, só acontecia com certas
  perguntas/alternativas específicas. Causa raiz, clássica de flex row:
  um item de flexbox tem `min-width: auto` por padrão, que o navegador
  resolve para o tamanho MÍNIMO DE CONTEÚDO do item — para texto, a
  largura do maior "token" sem quebra (sem espaço). Um trecho como
  "Data/Advogado/OAB/UF" (barra não é ponto de quebra em CSS por
  padrão) podia ser mais largo que o espaço restante na linha, e o item
  de flex se recusava a encolher além disso, estourando o cartão e, com
  ele, a página inteira. `min-width: 0` autoriza o item a encolher abaixo
  do próprio conteúdo; `overflow-wrap: anywhere` autoriza quebrar DENTRO
  de um token longo sem espaço, como último recurso, sem alterar o texto.
*/
.cartao-pergunta__alt-texto {
  min-width: 0;
  overflow-wrap: anywhere;
}

.cartao-pergunta__letra {
  font-weight: 700;
  min-width: 1.25em;
}

/* Tela estreita: cada pixel de borda e respiro sai da largura do texto. */
@media (max-width: 480px) {
  .cartao-pergunta {
    padding: var(--esp-3, 0.75rem);
  }

  .cartao-pergunta__letra {
    min-width: 1em;
  }
}

.cartao-pergunta__selo-professor {
  display: inline-block;
  max-width: 100%;
  margin: 0 0 var(--esp-2, 0.5rem);
  padding: var(--esp-1, 0.25rem) var(--esp-2, 0.5rem);
  border: var(--selo-professor-borda, none);
  border-radius: var(--raio-sm, 6px);
  background: var(--cor-selo-professor-bg, #7a2331);
  color: var(--cor-selo-professor-texto, #ffffff);
  font-size: var(--escala-xs, 0.8125rem);
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.cartao-pergunta__nota-caderno {
  margin-top: var(--esp-2, 0.5rem);
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-texto-suave, #4a4a4a);
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

.cartao-pergunta__resultado {
  position: relative;
}

.cartao-pergunta__veredito {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.cartao-pergunta__explicacao {
  margin-top: var(--esp-4, 1rem);
}
</style>
