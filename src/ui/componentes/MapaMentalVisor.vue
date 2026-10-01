<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import type { MapaFichamento } from '@/core/fichamento/tipos';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import { arvoreVisual, construirArvoreMapa } from '@/app/fichamento';
import MapaMental from './MapaMental.vue';
import MapaVisual from './MapaVisual.vue';

const props = defineProps<{
  dados: MapaFichamento;
  /** Endereço da unidade sem barra final. */
  baseUnidade: string;
}>();

const storeAdaptado = inject(CHAVE_STORE_MODO_ADAPTADO, undefined);

function modoAdaptadoLigado(): boolean {
  if (storeAdaptado) return storeAdaptado.ativo.value;
  return document.documentElement.getAttribute('data-modo-adaptado') === 'on';
}

function preferePoucoMovimento(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const semMovimento = ref(preferePoucoMovimento() || modoAdaptadoLigado());
/** Com movimento reduzido ou modo adaptado abre direto a lista; o mapa visual fica opcional. */
const modo = ref<'visual' | 'lista'>(semMovimento.value ? 'lista' : 'visual');

if (storeAdaptado) {
  watch(storeAdaptado.ativo, (ligado) => {
    semMovimento.value = preferePoucoMovimento() || ligado;
    if (ligado) modo.value = 'lista';
  });
}

const arvoreCompleta = computed(() => construirArvoreMapa(props.dados));
const arvoreDoMapa = computed(() => arvoreVisual(props.dados));

function alternarModo(): void {
  modo.value = modo.value === 'visual' ? 'lista' : 'visual';
}
</script>

<template>
  <section class="mapa-mental" aria-labelledby="mapa-mental-titulo">
    <h2 id="mapa-mental-titulo" class="mapa-mental__titulo">Mapa mental</h2>
    <p class="mapa-mental__intro">
      Do período histórico ao pensador e ao modo de pensar dele. Cada pensador tem uma cor. Prefere
      texto corrido? Veja o
      <a :href="`${baseUnidade}/fichamento`">Fichamento</a>.
    </p>
    <button
      type="button"
      class="mapa-mental__modo"
      aria-controls="mapa-mental-conteudo"
      @click="alternarModo"
    >
      {{ modo === 'visual' ? 'Ver em lista' : 'Ver mapa visual' }}
    </button>
    <div id="mapa-mental-conteudo">
      <MapaVisual
        v-if="modo === 'visual'"
        :arvore="arvoreDoMapa"
        :base-unidade="baseUnidade"
        :reduzir-movimento="semMovimento"
      />
      <MapaMental v-else :arvore="arvoreCompleta" :base-unidade="baseUnidade" />
    </div>
  </section>
</template>

<style scoped>
.mapa-mental {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding-block: var(--esp-5, 1.5rem);
}

.mapa-mental__titulo {
  margin-top: 0;
}

.mapa-mental__intro {
  max-width: var(--largura-leitura, 68ch);
}

.mapa-mental__modo {
  min-height: max(var(--alvo-toque-minimo, 24px), 44px);
  padding: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  border: var(--cartao-borda, 1px solid var(--cor-borda-forte, #c3bca4));
  border-radius: 999px;
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-primaria, #163a5f);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.mapa-mental__modo:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: var(--foco-deslocamento, 2px);
}

:root[data-modo-adaptado='on'] .mapa-mental__modo {
  color: #000000;
}

/* Modo adaptado: preto e branco puro em toda a aba do mapa. Os tokens de marca
   (azul-marinho) valem no resto do site, mas aqui entram em títulos,
   links e filetes; trocá-los no contêiner cobre a lista e o mapa de uma vez. */
:root[data-modo-adaptado='on'] .mapa-mental {
  --cor-primaria: #000000;
  --cor-titulo-texto: #000000;
  --cor-acento: #000000;
  --cor-bordo: #000000;
}
</style>
