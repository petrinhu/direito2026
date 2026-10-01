<script setup lang="ts">
import { computed } from 'vue';
import type { Mnemonico } from '@/core/mnemonicos/tipos';
import { ROTULOS_TECNICA } from '@/app/mnemonicos/rotulosTecnica';

const props = defineProps<{
  mnemonico: Mnemonico;
  revelado: boolean;
  /** Endereço da unidade sem barra final, para ligar ao bloco do resumo. */
  baseUnidade: string;
}>();

const emit = defineEmits<{ alternar: [string] }>();

const idResposta = computed(() => `mnemonico-${props.mnemonico.id}-resposta`);
</script>

<template>
  <article :id="`mnemonico-${mnemonico.id}`" class="mnemonico">
    <header class="mnemonico__cabecalho">
      <h3 class="mnemonico__titulo">{{ mnemonico.titulo }}</h3>
      <p class="mnemonico__tecnica">{{ ROTULOS_TECNICA[mnemonico.tecnica] }}</p>
    </header>
    <p class="mnemonico__dica">{{ mnemonico.dica }}</p>
    <p class="mnemonico__desafio">
      <strong>Tente dizer de cabeça:</strong> {{ mnemonico.desafio }}
    </p>
    <button
      type="button"
      class="mnemonico__botao"
      :aria-expanded="revelado ? 'true' : 'false'"
      :aria-controls="idResposta"
      @click="emit('alternar', mnemonico.id)"
    >
      {{ revelado ? 'Esconder a resposta' : 'Mostrar o que a dica guarda' }}
    </button>
    <div v-show="revelado" :id="idResposta" class="mnemonico__resposta">
      <dl class="mnemonico__guarda">
        <div v-for="item in mnemonico.guarda" :key="item.termo" class="mnemonico__item">
          <dt>{{ item.termo }}</dt>
          <dd>{{ item.explicacao }}</dd>
        </div>
      </dl>
      <p><strong>Como funciona:</strong> {{ mnemonico.comoFunciona }}</p>
      <p v-if="mnemonico.ressalva" class="mnemonico__ressalva">
        <strong>Atenção:</strong> {{ mnemonico.ressalva }}
      </p>
      <p class="mnemonico__resumo">
        <a :href="`${baseUnidade}#${mnemonico.blocoResumo}`">Ver o tema no Resumo</a>
      </p>
    </div>
  </article>
</template>

<style scoped>
.mnemonico {
  padding: var(--esp-4, 1rem);
  border: var(--cartao-borda, 1px solid var(--cor-borda, #dcd7c8));
  border-radius: var(--raio-md, 10px);
  background: var(--cor-fundo-elevado, #fff);
  box-shadow: var(--sombra-cartao, none);
  overflow-wrap: anywhere;
}

.mnemonico__cabecalho {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--esp-1, 0.25rem) var(--esp-3, 0.75rem);
}

.mnemonico__titulo {
  margin: 0;
  font-size: var(--escala-md, 1.25rem);
  color: var(--cor-titulo-texto, #0d2440);
}

.mnemonico__tecnica {
  margin: 0;
  padding: 0 var(--esp-2, 0.5rem);
  border-radius: var(--raio-sm, 6px);
  background: var(--cor-acento-claro, #f3ead1);
  color: var(--cor-acento, #7c621c);
  border: var(--selo-professor-borda, 0);
  font-size: var(--escala-xs, 0.8125rem);
  font-weight: 700;
}

.mnemonico__dica {
  margin-block: var(--esp-3, 0.75rem);
  padding-inline-start: var(--esp-3, 0.75rem);
  border-inline-start: 4px solid var(--cor-acento, #7c621c);
  font-size: var(--escala-base, 1.0625rem);
}

.mnemonico__desafio {
  margin-block: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
}

.mnemonico__botao {
  min-height: max(var(--alvo-toque-minimo, 24px), 44px);
  padding: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  border: var(--cartao-borda, 1px solid var(--cor-borda-forte, #c3bca4));
  border-radius: var(--raio-sm, 6px);
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-primaria, #163a5f);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.mnemonico__botao[aria-expanded='true'] {
  background: var(--cor-primaria, #163a5f);
  color: var(--cor-texto-invertido, #faf9f5);
}

.mnemonico__botao:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: var(--foco-deslocamento, 2px);
}

.mnemonico__resposta {
  margin-top: var(--esp-3, 0.75rem);
  padding-top: var(--esp-3, 0.75rem);
  border-top: 1px solid var(--cor-borda, #dcd7c8);
}

.mnemonico__guarda {
  margin: 0 0 var(--esp-3, 0.75rem);
}

.mnemonico__item {
  margin-block: var(--esp-2, 0.5rem);
}

/* Todo termo no mesmo estilo: termo em linha própria, explicação embaixo. */
.mnemonico__item dt {
  display: block;
  font-weight: 700;
}

.mnemonico__item dd {
  margin: 0;
}

.mnemonico__ressalva {
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
  border: 1px dashed var(--cor-borda-forte, #c3bca4);
  border-radius: var(--raio-sm, 6px);
}

.mnemonico__resumo a {
  display: inline-flex;
  align-items: center;
  min-height: var(--alvo-toque-minimo, 24px);
}

@media print {
  .mnemonico {
    break-inside: avoid;
    box-shadow: none;
  }

  .mnemonico__resposta {
    display: block !important;
  }

  .mnemonico__botao {
    display: none;
  }
}
</style>
