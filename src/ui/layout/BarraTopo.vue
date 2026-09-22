<script setup lang="ts">
import type { StoreTema } from '@/app/stores/tema';
import type { StoreBusca } from '@/app/stores/busca';
import AlternadorTema from '../componentes/AlternadorTema.vue';
import CampoBusca from '../componentes/CampoBusca.vue';

defineProps<{ storeTema: StoreTema; storeBusca: StoreBusca }>();
const emit = defineEmits<{ 'abrir-gaveta': []; buscar: [string] }>();
</script>

<template>
  <header class="barra-topo">
    <button
      type="button"
      class="barra-topo__botao-gaveta"
      aria-label="Abrir menu do currículo"
      @click="emit('abrir-gaveta')"
    >
      ☰
    </button>
    <a href="/" class="barra-topo__marca">Caderno de Direito</a>
    <CampoBusca :store="storeBusca" @enviar="(termo) => emit('buscar', termo)" />
    <AlternadorTema :store="storeTema" />
  </header>
</template>

<style scoped>
.barra-topo {
  display: flex;
  align-items: center;
  gap: var(--esp-4, 1rem);
  padding: var(--esp-3, 0.75rem) var(--esp-5, 1.5rem);
  background: var(--cor-primaria-escura, #0d2440);
  color: var(--cor-texto-invertido, #faf9f5);
}

.barra-topo__marca {
  color: inherit;
  text-decoration: none;
  font-family: var(--fonte-titulo);
  font-size: var(--escala-md, 1.25rem);
  margin-right: auto;
}

.barra-topo__botao-gaveta {
  display: none;
  min-height: 44px;
  min-width: 44px;
  background: none;
  border: none;
  color: inherit;
  font-size: 1.5rem;
  cursor: pointer;
}

@media (max-width: 880px) {
  .barra-topo__botao-gaveta {
    display: block;
  }
}

@media print {
  .barra-topo {
    display: none;
  }
}
</style>
