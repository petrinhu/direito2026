<script setup lang="ts">
/**
 * Posiciona o banner de versão nova como faixa fixa logo ABAIXO do cabeçalho (ratificado pelo
 * líder, 46d e 46g). O topo é a altura medida do cabeçalho (--altura-cabecalho, publicada pela
 * BarraTopo quando ela está fixa; 0px quando não está). Não empurra o conteúdo: fica por cima.
 */
</script>

<template>
  <div class="aviso-versao-posicao">
    <slot />
  </div>
</template>

<style scoped>
.aviso-versao-posicao {
  position: fixed;
  top: var(--altura-cabecalho, 0px);
  left: 0;
  right: 0;
  z-index: 50;
}
</style>
