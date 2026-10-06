<script setup lang="ts">
import { computed } from 'vue';
import { ALTURA_LOGICA, LARGURA_LOGICA } from '@/app/restrito/palco';

const props = defineProps<{
  /** Fator que faz o palco lógico (1600x900) caber no espaço disponível. */
  escala: number;
}>();

const caixa = computed(() => ({
  width: `${LARGURA_LOGICA * props.escala}px`,
  height: `${ALTURA_LOGICA * props.escala}px`
}));
const palco = computed(() => ({
  width: `${LARGURA_LOGICA}px`,
  height: `${ALTURA_LOGICA}px`,
  transform: `scale(${props.escala})`
}));
</script>

<template>
  <div class="ar-palco-slide" :style="caixa">
    <div class="ar-palco-slide__escala" :style="palco">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ar-palco-slide {
  position: relative;
  margin-inline: auto;
  overflow: hidden;
}

.ar-palco-slide__escala {
  transform-origin: 0 0;
}
</style>
