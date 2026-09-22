<script setup lang="ts">
import type { BlocoResumo } from '@/core/unidade/tipos';
import BlocoTeorico from './BlocoTeorico.vue';

defineProps<{ blocos: readonly BlocoResumo[] }>();
const emit = defineEmits<{ 'bloco-lido': [string] }>();
</script>

<template>
  <div class="visor-resumo">
    <nav aria-label="Sumário do resumo" class="visor-resumo__sumario">
      <ol>
        <li v-for="bloco in blocos" :key="bloco.id">
          <a :href="`#${bloco.id}`">{{ bloco.titulo }}</a>
        </li>
      </ol>
    </nav>
    <BlocoTeorico
      v-for="bloco in blocos"
      :key="bloco.id"
      :bloco="bloco"
      @lido="emit('bloco-lido', $event)"
    />
  </div>
</template>

<style scoped>
.visor-resumo__sumario {
  max-width: var(--largura-coluna-leitura, 760px);
  margin-inline: auto;
  padding-top: var(--esp-5, 1.5rem);
}

.visor-resumo__sumario ol {
  padding-left: var(--esp-5, 1.5rem);
}

.visor-resumo__sumario a {
  /* Achado do QA final (docs/qa-final-onda.md): min-height do `a` global
     (base.css) não tem efeito nenhum aqui porque o elemento fica `inline`
     por padrão, e min-height/min-width não se aplicam a inline (CSSOM).
     `inline-flex` + `align-items: center` faz o mesmo token de piso de
     alvo (tokens.css, --alvo-toque-minimo) valer de verdade: 24px fora do
     modo adaptado (igual ao piso que já vigora hoje, sem esticar o
     desenho normal) e 44px dentro dele. Padding, não fonte maior, é quem
     abre a área clicável até o piso. */
  display: inline-flex;
  align-items: center;
  min-height: var(--alvo-toque-minimo, 24px);
  min-width: var(--alvo-toque-minimo, 24px);
  padding-block: var(--esp-1, 0.25rem);
}

@media print {
  .visor-resumo__sumario {
    display: none;
  }
}
</style>
