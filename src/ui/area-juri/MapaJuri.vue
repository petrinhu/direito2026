<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import { paraArvoreLista, paraArvoreMarkmapRestrita } from '@/app/restrito';
import type { NoMapa } from '@/core/restrito/tipos';
import MapaMarkmap from '../componentes/MapaMarkmap.vue';
import MapaMental from '../componentes/MapaMental.vue';

const props = defineProps<{ mapa: NoMapa }>();

// Mesma regra do mapa das páginas de estudo: modo adaptado e movimento reduzido abrem a lista.
const storeAdaptado = inject(CHAVE_STORE_MODO_ADAPTADO, undefined);

function modoAdaptadoLigado(): boolean {
  if (storeAdaptado) return storeAdaptado.ativo.value;
  return document.documentElement.getAttribute('data-modo-adaptado') === 'on';
}

function preferePoucoMovimento(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const semMovimento = ref(preferePoucoMovimento() || modoAdaptadoLigado());
const modo = ref<'visual' | 'lista'>(semMovimento.value ? 'lista' : 'visual');

if (storeAdaptado) {
  watch(storeAdaptado.ativo, (ligado) => {
    semMovimento.value = preferePoucoMovimento() || ligado;
    if (ligado) modo.value = 'lista';
  });
}

const arvoreVisual = computed(() => paraArvoreMarkmapRestrita(props.mapa));
const arvoreLista = computed(() => paraArvoreLista(props.mapa));

function alternarModo(): void {
  modo.value = modo.value === 'visual' ? 'lista' : 'visual';
}
</script>

<template>
  <section class="juri-mapa" aria-labelledby="juri-mapa-titulo">
    <h2 id="juri-mapa-titulo">Mapa mental</h2>
    <p class="juri-ajuda">Do tema central aos desdobramentos. A aba Resumo traz o texto corrido.</p>
    <button
      type="button"
      class="juri-botao juri-botao--secundario"
      aria-controls="mapa-juri-conteudo"
      @click="alternarModo"
    >
      {{ modo === 'visual' ? 'Ver em lista' : 'Ver mapa visual' }}
    </button>
    <div id="mapa-juri-conteudo">
      <MapaMarkmap
        v-if="modo === 'visual'"
        :arvore="arvoreVisual"
        :reduzir-movimento="semMovimento"
        ajuda="Toque num ramo para abrir ou fechar. Arraste para mover e use a roda ou a pinça para o zoom."
      />
      <MapaMental
        v-else
        :arvore="arvoreLista"
        base-unidade=""
        rotulo-arvore="Mapa mental do tema"
      />
    </div>
  </section>
</template>
