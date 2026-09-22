<script setup lang="ts">
/**
 * Item desativado do menu, e também a página de "em breve" (seção 6 da
 * arquitetura). Nunca <a> sem href nem <button disabled>: os dois saem da
 * ordem de foco e desaparecem para quem navega por teclado.
 */
defineProps<{ rotulo: string }>();
</script>

<template>
  <span class="estado-em-breve" aria-disabled="true">
    {{ rotulo }}
    <span class="estado-em-breve__selo">em breve</span>
  </span>
</template>

<style scoped>
.estado-em-breve {
  display: inline-flex;
  align-items: center;
  gap: var(--esp-2, 0.5rem);
  color: var(--cor-desativado-texto, #8a8672);
}

.estado-em-breve__selo {
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-selo-texto, #5a5442);
  background: var(--cor-selo-bg, #ece7d6);
  border-radius: var(--raio-sm, 6px);
  padding: 0.05rem 0.5rem;
}
</style>
