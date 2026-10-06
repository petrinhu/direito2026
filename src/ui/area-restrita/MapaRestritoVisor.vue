<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import { paraArvoreLista, paraArvoreMarkmapRestrita, usarSemMovimento } from '@/app/restrito';
import type { NoMapa } from '@/core/restrito/tipos';
import MapaMarkmap from '../componentes/MapaMarkmap.vue';
import MapaMental from '../componentes/MapaMental.vue';

const props = defineProps<{ mapa: NoMapa }>();

const storeAdaptado = inject(CHAVE_STORE_MODO_ADAPTADO, undefined);
const semMovimento = usarSemMovimento(storeAdaptado);
/** Com movimento reduzido ou modo adaptado abre direto a lista; o mapa visual fica opcional. */
const modo = ref<'visual' | 'lista'>(semMovimento.value ? 'lista' : 'visual');
if (storeAdaptado) {
  watch(storeAdaptado.ativo, (ligado) => {
    if (ligado) modo.value = 'lista';
  });
}

// Mesma fonte para o mapa visual e para a lista acessível.
const arvoreVisual = computed(() => paraArvoreMarkmapRestrita(props.mapa));
const arvoreLista = computed(() => paraArvoreLista(props.mapa));

function alternarModo(): void {
  modo.value = modo.value === 'visual' ? 'lista' : 'visual';
}
</script>

<template>
  <section class="ar-mapa" aria-labelledby="ar-mapa-titulo">
    <h2 id="ar-mapa-titulo">Mapa mental</h2>
    <p class="ar-mapa__intro">
      Do tema central aos desdobramentos, um ramo de cor para cada ideia. A aba Resumo traz o texto
      corrido.
    </p>
    <button type="button" class="ar-botao" aria-controls="ar-mapa-conteudo" @click="alternarModo">
      {{ modo === 'visual' ? 'Ver em lista' : 'Ver mapa visual' }}
    </button>
    <div id="ar-mapa-conteudo">
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

<style scoped>
.ar-mapa__intro {
  max-width: var(--largura-leitura, 68ch);
}
</style>
