<script setup lang="ts">
import type { Cadeira, Periodo } from '@/core/curriculo/tipos';

defineProps<{
  periodo: Periodo;
  cadeira: Cadeira;
  href: string;
}>();
</script>

<template>
  <a :href="href" class="cartao-restrito">
    <span class="cartao-restrito__rotulo">{{ periodo.rotulo }} · Área restrita</span>
    <h3 class="cartao-restrito__cadeira">{{ cadeira.nome }}</h3>
    <p class="cartao-restrito__aviso">Acesso com login.</p>
  </a>
</template>

<style scoped>
.cartao-restrito {
  display: block;
  padding: var(--esp-5, 1.5rem);
  border: 1px solid var(--cor-borda, #dcd7c8);
  border-radius: var(--raio-md, 10px);
  background: var(--cor-fundo-elevado, #fff);
  box-shadow: var(--sombra-cartao);
  text-decoration: none;
  color: inherit;
}

.cartao-restrito:focus-visible {
  outline: 2px solid var(--cor-primaria, #163a5f);
  outline-offset: 2px;
}

.cartao-restrito__rotulo {
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-primaria, #163a5f);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cartao-restrito__cadeira {
  font-family: var(--fonte-titulo);
  margin: var(--esp-2, 0.5rem) 0;
}

.cartao-restrito__aviso {
  margin: 0;
  color: var(--cor-texto-suave, #4a4a4a);
}
</style>
