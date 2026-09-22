<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { BlocoResumo } from '@/core/unidade/tipos';
import QuadroResumo from './QuadroResumo.vue';

const props = defineProps<{ bloco: BlocoResumo }>();
const emit = defineEmits<{ lido: [string] }>();

const raizRef = ref<HTMLElement | undefined>();
let observador: IntersectionObserver | undefined;

onMounted(() => {
  const elemento = raizRef.value;
  if (!elemento || typeof IntersectionObserver === 'undefined') return;
  observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) {
          emit('lido', props.bloco.id);
          observador?.disconnect();
        }
      }
    },
    { threshold: 0.6 }
  );
  observador.observe(elemento);
});

onBeforeUnmount(() => observador?.disconnect());
</script>

<template>
  <section :id="bloco.id" ref="raizRef" class="bloco-teorico">
    <header class="bloco-teorico__cabecalho">
      <span class="bloco-teorico__numero">Bloco {{ bloco.numero }}</span>
      <span v-if="bloco.badge" class="bloco-teorico__badge">{{ bloco.badge }}</span>
    </header>
    <h2 class="bloco-teorico__titulo">{{ bloco.titulo }}</h2>
    <p class="bloco-teorico__fonte">{{ bloco.fonte }}</p>
    <!-- v-html só recebe corpoHtml, que vem de src/conteudo/ (seção 4.4). -->
    <div class="bloco-teorico__corpo" v-html="bloco.corpoHtml" />
    <QuadroResumo :itens="bloco.resumo" />
    <p class="bloco-teorico__exemplo">
      <strong>Na prática do operador do direito:</strong>
      <span v-html="bloco.exemploHtml" />
    </p>
  </section>
</template>

<style scoped>
.bloco-teorico {
  max-width: var(--largura-coluna-leitura, 760px);
  margin-inline: auto;
  padding-block: var(--esp-7, 3rem);
  break-before: page;
  page-break-before: always;
}

.bloco-teorico__cabecalho {
  display: flex;
  gap: var(--esp-2, 0.5rem);
  align-items: center;
}

.bloco-teorico__numero {
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-primaria, #163a5f);
  text-transform: uppercase;
}

.bloco-teorico__badge {
  font-size: var(--escala-xs, 0.8125rem);
  background: var(--cor-acento-claro, #f3ead1);
  color: var(--cor-acento, #8a6d1f);
  border-radius: var(--raio-sm, 6px);
  padding: 0.05rem 0.5rem;
}

.bloco-teorico__titulo {
  font-family: var(--fonte-titulo);
}

.bloco-teorico__corpo :deep(p) {
  line-height: var(--altura-linha-texto, 1.7);
}

.bloco-teorico__corpo :deep(button.citacao) {
  background: none;
  border: none;
  border-bottom: 1px dashed var(--cor-primaria, #163a5f);
  color: var(--cor-primaria, #163a5f);
  font: inherit;
  cursor: pointer;
  padding: 0;
}
</style>
