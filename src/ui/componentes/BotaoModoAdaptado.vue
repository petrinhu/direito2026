<script setup lang="ts">
import type { StoreModoAdaptado } from '@/app/stores/modoAdaptado';

const props = defineProps<{ store: StoreModoAdaptado }>();

/**
 * Textos exatos da especificação (docs/modo-adaptado.md, seção 5): o
 * estado é sempre lido tanto pelo rótulo visível quanto pelo par
 * aria-pressed/aria-label, nunca só pela troca de ícone.
 */
const ROTULO_DESLIGADO = 'Leitura ampliada';
const ROTULO_LIGADO = 'Leitura normal';
const ARIA_LABEL_DESLIGADO =
  'Ativar modo de leitura adaptada: texto maior e contraste máximo em preto e branco';
const ARIA_LABEL_LIGADO = 'Desativar modo de leitura adaptada e voltar ao tamanho e à cor normais';
</script>

<template>
  <button
    type="button"
    class="botao-modo-adaptado"
    :aria-pressed="props.store.ativo.value ? 'true' : 'false'"
    :aria-label="props.store.ativo.value ? ARIA_LABEL_LIGADO : ARIA_LABEL_DESLIGADO"
    @click="props.store.alternar()"
  >
    <span aria-hidden="true">A</span>
    <span class="botao-modo-adaptado__rotulo">
      {{ props.store.ativo.value ? ROTULO_LIGADO : ROTULO_DESLIGADO }}
    </span>
  </button>
</template>

<style scoped>
.botao-modo-adaptado {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-2, 0.5rem);
  min-height: var(--alvo-toque-minimo, 44px);
  min-width: var(--alvo-toque-minimo, 44px);
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
  background: none;
  border: 1px solid var(--cor-borda, #dcd7c8);
  border-radius: var(--raio-md, 10px);
  color: inherit;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.botao-modo-adaptado:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-primaria, #163a5f);
  outline-offset: 2px;
}

.botao-modo-adaptado__rotulo {
  font-size: var(--escala-sm, 0.9375rem);
}
</style>
