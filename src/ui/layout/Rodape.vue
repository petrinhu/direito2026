<script setup lang="ts">
const ano = new Date().getFullYear();
</script>

<template>
  <!--
    Exatamente três coisas, decididas pelo líder em 21/09/2026 (seção 6 da
    arquitetura): nome, ano e aviso de material de estudo sem valor oficial.
    Mais o aviso de que o progresso fica salvo neste navegador. Sem
    autoria, sem instituição, sem contato: ponto mais sensível de R3, e
    coberto por scripts/verificar-proibicoes.sh.
  -->
  <footer class="rodape">
    <p>Caderno de Direito · {{ ano }}</p>
    <p>Material de estudo sem valor oficial.</p>
    <p>O progresso fica salvo neste navegador.</p>
  </footer>
</template>

<style scoped>
.rodape {
  padding: var(--esp-6, 2rem) var(--esp-5, 1.5rem);
  text-align: center;
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-texto-suave, #4a4a4a);
  border-top: 1px solid var(--cor-borda, #dcd7c8);
}

.rodape p {
  margin: var(--esp-1, 0.25rem) 0;
}

@media print {
  .rodape {
    display: none;
  }
}
</style>
