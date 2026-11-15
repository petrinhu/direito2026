<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { carregarHistorico, paginaNovidades } from '@/app/versoes/paginas';

/**
 * Página Novidades (HIST-F2, ordem do líder de 14/11): o que mudou em cada versão, em linguagem simples.
 * Título focado ao abrir, uma seção por versão (h2 com versão e data) e cada alteração numa lista.
 */
const titulo = ref<HTMLElement | null>(null);
const carga = carregarHistorico();
const entradas = carga.ok ? paginaNovidades(carga.entradas) : [];

onMounted(() => titulo.value?.focus());
</script>

<template>
  <article class="pagina-versoes">
    <h1 ref="titulo" tabindex="-1" class="pagina-versoes__titulo">Novidades</h1>
    <p class="pagina-versoes__intro">O que mudou em cada versão do site, em linguagem simples.</p>
    <p v-if="!carga.ok" role="status">Não foi possível carregar as novidades agora.</p>
    <section
      v-for="entrada in entradas"
      :key="entrada.versao"
      class="pagina-versoes__versao"
      :aria-labelledby="`novidades-${entrada.versao.replace(/\./g, '-')}`"
    >
      <h2 :id="`novidades-${entrada.versao.replace(/\./g, '-')}`">
        Versão {{ entrada.versao }}
        <span class="pagina-versoes__data">{{ entrada.dataFormatada }}</span>
      </h2>
      <ul>
        <li v-for="(item, i) in entrada.itens" :key="i">{{ item }}</li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
.pagina-versoes {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding: var(--esp-6, 2rem) var(--esp-4, 1rem);
}

.pagina-versoes__titulo:focus {
  outline: 2px solid var(--cor-foco, currentColor);
  outline-offset: 4px;
}

.pagina-versoes__data {
  font-weight: normal;
  color: var(--cor-texto-suave, inherit);
}

.pagina-versoes__versao {
  margin-block: var(--esp-6, 2rem);
}
</style>
