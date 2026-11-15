<script setup lang="ts">
import { carregarHistorico, paginaChangelog } from '@/app/versoes/paginas';

/**
 * Página Changelog (HIST-F2, ordem do líder de 14/11): o registro técnico de cada versão.
 * Título sem foco próprio (o roteador leva o foco ao conteúdo), uma seção por versão (h2 com versão e data) e cada alteração numa lista.
 */
const props = defineProps<{ origem?: unknown }>();
const carga = carregarHistorico(props.origem);
const entradas = carga.ok ? paginaChangelog(carga.entradas) : [];
</script>

<template>
  <article class="pagina-versoes">
    <h1 class="pagina-versoes__titulo">Changelog</h1>
    <p class="pagina-versoes__intro">O registro técnico de cada versão do site.</p>
    <p v-if="!carga.ok" role="status">Não foi possível carregar o registro técnico agora.</p>
    <section
      v-for="entrada in entradas"
      :key="entrada.versao"
      class="pagina-versoes__versao"
      :aria-labelledby="`changelog-${entrada.versao.replace(/\./g, '-')}`"
    >
      <h2 :id="`changelog-${entrada.versao.replace(/\./g, '-')}`">
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

.pagina-versoes__data {
  font-weight: normal;
  color: var(--cor-texto-suave, inherit);
}

.pagina-versoes__versao {
  margin-block: var(--esp-6, 2rem);
}
</style>
