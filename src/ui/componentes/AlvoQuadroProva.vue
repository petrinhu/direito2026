<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { CHAVE_ALVO_QUADRO_APOS_TITULO } from './alvoQuadroProva';

/**
 * Lugar do quadro de prova logo depois do título da página, no modo adaptado (E2E-G1A-ADAPTADO, decisão
 * do CTO de 20/11/2026, a ratificar pelo líder). Fora do modo o quadro fica na pilha inferior e este
 * elemento fica vazio, sem altura.
 */
const avisar = inject(CHAVE_ALVO_QUADRO_APOS_TITULO, undefined);
const raiz = ref<HTMLElement | null>(null);

onMounted(() => {
  avisar?.(raiz.value);
});

onBeforeUnmount(() => {
  avisar?.(null);
});
</script>

<template>
  <div ref="raiz" class="alvo-quadro-prova" />
</template>

<style scoped>
:root[data-modo-adaptado='on'] .alvo-quadro-prova:not(:empty) {
  padding-bottom: var(--esp-4, 1rem);
}
</style>
