<script setup lang="ts">
import { ref, useId } from 'vue';
import type { MnemonicoJuri } from '@/core/juri/tipos';
import FontesJuri from './FontesJuri.vue';

defineProps<{ mnemonicos: readonly MnemonicoJuri[] }>();

const base = `juri-mnemonico-${useId()}`;
const reveladas = ref<ReadonlySet<string>>(new Set());

function alternar(id: string): void {
  const nova = new Set(reveladas.value);
  if (nova.has(id)) nova.delete(id);
  else nova.add(id);
  reveladas.value = nova;
}

function esconderTodas(): void {
  reveladas.value = new Set();
}
</script>

<template>
  <section class="juri-mnemonicos" aria-labelledby="juri-mnemonicos-titulo">
    <h2 id="juri-mnemonicos-titulo">Mnemônicos</h2>
    <p class="juri-ajuda">
      Leia a dica, tente dizer de cabeça o que ela guarda e só depois mostre a resposta.
    </p>
    <button type="button" class="juri-botao juri-botao--secundario" @click="esconderTodas">
      Esconder todas as respostas
    </button>
    <article v-for="mnemonico in mnemonicos" :key="mnemonico.id" class="juri-cartao">
      <div v-html="mnemonico.dicaHtml" />
      <button
        type="button"
        class="juri-botao juri-botao--secundario"
        :aria-expanded="reveladas.has(mnemonico.id) ? 'true' : 'false'"
        :aria-controls="`${base}-${mnemonico.id}-resposta`"
        @click="alternar(mnemonico.id)"
      >
        {{ reveladas.has(mnemonico.id) ? 'Esconder a resposta' : 'Mostrar a resposta' }}
      </button>
      <div v-if="reveladas.has(mnemonico.id)" :id="`${base}-${mnemonico.id}-resposta`">
        <div v-html="mnemonico.respostaHtml" />
      </div>
      <FontesJuri :fontes="mnemonico.fontes" />
    </article>
  </section>
</template>
