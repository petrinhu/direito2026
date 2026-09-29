<script setup lang="ts">
import type { StoreTema } from '@/app/stores/tema';

const props = defineProps<{ store: StoreTema }>();

const ROTULOS = { sistema: 'Tema do sistema', claro: 'Tema claro', escuro: 'Tema escuro' } as const;
</script>

<template>
  <button
    type="button"
    class="alternador-tema"
    :aria-label="`${ROTULOS[props.store.tema.value]}. Ativar o próximo tema.`"
    @click="props.store.alternar()"
  >
    <span aria-hidden="true">{{ props.store.tema.value === 'escuro' ? '🌙' : '☀' }}</span>
    <span class="alternador-tema__rotulo">{{ ROTULOS[props.store.tema.value] }}</span>
  </button>
</template>

<style scoped>
.alternador-tema {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-2, 0.5rem);
  min-height: 44px;
  min-width: 44px;
  max-width: 100%;
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
  background: none;
  border: 1px solid var(--cor-borda, #dcd7c8);
  border-radius: var(--raio-md, 10px);
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.alternador-tema:focus-visible {
  outline: 2px solid var(--cor-primaria, #163a5f);
  outline-offset: 2px;
}

.alternador-tema__rotulo {
  font-size: var(--escala-sm, 0.9375rem);
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: left;
}

/* Tela estreita, modo normal: só o ícone (sol/lua), para os três controles
   do cabeçalho caberem sem sair da tela (IMPORTANTE 2 de
   docs/qa-sociologia-u1.md). O nome acessível não muda: vem do aria-label do
   botão, e o texto continua no DOM, só escondido dos olhos (mesma técnica do
   rótulo da busca). No modo adaptado o texto fica, porque quem liga o modo
   precisa do rótulo grande. */
@media (max-width: 640px) {
  :root:not([data-modo-adaptado='on']) .alternador-tema__rotulo {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
}
</style>
