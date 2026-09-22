<script setup lang="ts">
import type { DocumentoBusca } from '@/core/busca/tipos';

defineProps<{ resultados: readonly DocumentoBusca[]; termo: string }>();
</script>

<template>
  <div class="painel-resultados-busca" role="region" aria-live="polite" aria-label="Resultados da busca">
    <p v-if="termo && resultados.length === 0">Nenhum resultado para "{{ termo }}".</p>
    <ul v-else>
      <li v-for="resultado in resultados" :key="resultado.id" class="painel-resultados-busca__item">
        <a :href="resultado.url">
          <strong>{{ resultado.titulo }}</strong>
          <span class="painel-resultados-busca__trilha">
            {{ resultado.periodo }} · {{ resultado.cadeira }} · {{ resultado.unidade }}
          </span>
          <span class="painel-resultados-busca__trecho">{{ resultado.trecho }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.painel-resultados-busca ul {
  list-style: none;
  padding: 0;
}

.painel-resultados-busca__item a {
  display: block;
  padding: var(--esp-3, 0.75rem);
  text-decoration: none;
  color: inherit;
  border-bottom: 1px solid var(--cor-borda, #dcd7c8);
}

.painel-resultados-busca__trilha {
  display: block;
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-texto-suave, #4a4a4a);
}

.painel-resultados-busca__trecho {
  display: block;
  font-size: var(--escala-sm, 0.9375rem);
}
</style>
