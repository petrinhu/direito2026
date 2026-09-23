<script setup lang="ts"></script>

<template>
  <aside class="dicas-forma" aria-label="Dicas de forma anotadas pela professora">
    <h3 class="dicas-forma__titulo">Dicas de forma, anotadas no quadro</h3>
    <ul class="dicas-forma__lista">
      <li>Fatos: no máximo <strong>dez linhas</strong>.</li>
      <li>Peça inteira: limite total de <strong>150 linhas</strong>.</li>
    </ul>
  </aside>
</template>

<style scoped>
.dicas-forma {
  max-width: var(--largura-coluna-leitura, 760px);
  margin-block: var(--esp-5, 1.5rem);
  padding: var(--esp-4, 1rem);
  background: var(--cor-acento-claro, #f3ead1);
  color: var(--cor-acento, #8a6d1f);
  border-radius: var(--raio-md, 10px);
}

.dicas-forma__titulo {
  font-family: var(--fonte-titulo);
  margin-block-start: 0;
}

.dicas-forma__lista {
  margin: 0;
  padding-inline-start: var(--esp-5, 1.5rem);
}
</style>
