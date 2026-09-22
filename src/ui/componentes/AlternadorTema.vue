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
}
</style>
