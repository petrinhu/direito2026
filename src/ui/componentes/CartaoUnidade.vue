<script setup lang="ts">
import type { ReferenciaUnidade } from '@/core/curriculo/tipos';
import EstadoEmBreve from './EstadoEmBreve.vue';

defineProps<{
  unidade: ReferenciaUnidade;
  href: string;
  progresso?: { lidos: number; total: number };
}>();
</script>

<template>
  <EstadoEmBreve v-if="unidade.estado === 'em-breve'" :rotulo="unidade.titulo" />
  <a v-else :href="href" class="cartao-unidade">
    <span class="cartao-unidade__rotulo">{{ unidade.rotulo }}</span>
    <h3 class="cartao-unidade__titulo">{{ unidade.titulo }}</h3>
    <span v-if="progresso" class="cartao-unidade__progresso">
      {{ progresso.lidos }} de {{ progresso.total }} blocos lidos
    </span>
  </a>
</template>

<style scoped>
.cartao-unidade {
  display: block;
  padding: var(--esp-5, 1.5rem);
  border: 1px solid var(--cor-borda, #dcd7c8);
  border-radius: var(--raio-md, 10px);
  background: var(--cor-fundo-elevado, #fff);
  box-shadow: var(--sombra-cartao);
  text-decoration: none;
  color: inherit;
}

.cartao-unidade:focus-visible {
  outline: 2px solid var(--cor-primaria, #163a5f);
  outline-offset: 2px;
}

.cartao-unidade__rotulo {
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-primaria, #163a5f);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cartao-unidade__titulo {
  font-family: var(--fonte-titulo);
  margin: var(--esp-2, 0.5rem) 0;
}

.cartao-unidade__progresso {
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-texto-suave, #4a4a4a);
}
</style>
