<script setup lang="ts">
/**
 * Posiciona o banner de versão nova como faixa fixa logo ABAIXO do cabeçalho (ratificado pelo
 * líder, 46d e 46g). O topo é a borda de baixo VISÍVEL do cabeçalho (--base-visivel-cabecalho,
 * publicada pela BarraTopo a cada rolagem; 0px quando ele saiu da tela). Não empurra o conteúdo.
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
  top: var(--base-visivel-cabecalho, 0px);
  left: 0;
  right: 0;
  z-index: 50;
}
</style>
