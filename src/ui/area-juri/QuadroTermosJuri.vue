<script setup lang="ts">
import type { LinhaQuadroTermos } from '@/core/juri/tipos';
import FontesJuri from './FontesJuri.vue';

defineProps<{ termos: readonly LinhaQuadroTermos[] }>();
</script>

<template>
  <section class="juri-termos" aria-labelledby="juri-termos-titulo">
    <h2 id="juri-termos-titulo">Quadro dos termos</h2>
    <dl class="juri-termos__lista">
      <div v-for="linha in termos" :key="linha.termo" class="juri-termos__item">
        <dt>{{ linha.termo }}</dt>
        <dd>
          <p class="juri-termos__regiao">{{ linha.regiao }}</p>
          <div v-html="linha.definicaoHtml" />
          <FontesJuri :fontes="linha.fontes" />
        </dd>
      </div>
    </dl>
  </section>
</template>
