<script setup lang="ts">
import { AVISO_LEGAL } from '@/conteudo/avisoLegal';
</script>

<template>
  <section class="aviso-legal" role="note" aria-label="Aviso legal">
    <p class="aviso-legal__texto">
      <strong>{{ AVISO_LEGAL.rotulo }}</strong> {{ AVISO_LEGAL.corpo }}
    </p>
  </section>
</template>

<style scoped>
/*
  Cores e tamanho vêm só de tokens: no tema escuro e no modo adaptado
  (fundo branco, borda e texto pretos, --escala-base em 24px) a caixa muda
  sozinha, sem seletor próprio por modo.
*/
.aviso-legal {
  box-sizing: border-box;
  max-width: 70ch;
  margin: var(--esp-6, 2rem) auto var(--esp-4, 1rem);
  padding: var(--esp-4, 1rem) var(--esp-5, 1.5rem);
  background: var(--cor-fundo-sutil, #f2efe6);
  border: 2px solid var(--cor-acento, #7c621c);
  border-radius: var(--raio-sm, 6px);
  color: var(--cor-texto, #1c1c1c);
}

.aviso-legal__texto {
  margin: 0;
  font-size: var(--escala-base, 1.0625rem);
  line-height: 1.6;
  text-align: start;
}

@media print {
  .aviso-legal {
    background: #fff;
    border-color: #000;
    color: #111;
    break-inside: avoid;
  }
}
</style>
