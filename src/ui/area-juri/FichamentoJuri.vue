<script setup lang="ts">
import type { FichaJuri } from '@/core/juri/tipos';
import CartaoFichamentoJuri from './CartaoFichamentoJuri.vue';

defineProps<{ fichamento: readonly FichaJuri[] }>();
</script>

<template>
  <section class="juri-fichamento" aria-labelledby="juri-fichamento-titulo">
    <h2 id="juri-fichamento-titulo">Fichamento</h2>
    <p class="juri-ajuda">Uma ficha por item. Abra a ficha pelo nome para ler os campos.</p>
    <CartaoFichamentoJuri
      v-for="ficha in fichamento"
      :key="ficha.id"
      :titulo="ficha.titulo"
      :campos="[
        { rotulo: 'O que é', html: ficha.oQueEHtml },
        { rotulo: 'O que a fonte diz', html: ficha.fonteDizHtml },
        { rotulo: 'Como a acusação usa', html: ficha.acusacaoUsaHtml },
        { rotulo: 'Como a acusação neutraliza a defesa', html: ficha.acusacaoNeutralizaHtml }
      ]"
      :fontes="ficha.fontes"
    />
  </section>
</template>
