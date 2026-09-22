<script setup lang="ts">
import { inject } from 'vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import FundoAnimado from '../componentes/FundoAnimado.vue';
import CartaoUnidade from '../componentes/CartaoUnidade.vue';

const curriculo = inject(CHAVE_CURRICULO)!;
const periodosComMaterial = curriculo.filter((p) => p.cadeiras.length > 0);
</script>

<template>
  <div class="pagina-home">
    <FundoAnimado :altura="280" />
    <div class="pagina-home__hero">
      <h1>Caderno de Direito</h1>
      <p>Resumo de estudo, petição comentada e quiz, período por período.</p>
    </div>
    <section aria-label="Unidades disponíveis" class="pagina-home__lista">
      <template v-for="periodo in periodosComMaterial" :key="periodo.id">
        <template v-for="cadeira in periodo.cadeiras" :key="cadeira.id">
          <CartaoUnidade
            v-for="unidade in cadeira.unidades"
            :key="unidade.id"
            :unidade="unidade"
            :href="`/p/${periodo.id}/${cadeira.id}/${unidade.id}`"
          />
        </template>
      </template>
    </section>
  </div>
</template>

<style scoped>
.pagina-home__hero {
  max-width: var(--largura-conteudo, 1180px);
  margin: -140px auto 0;
  padding: var(--esp-6, 2rem);
  color: var(--cor-hero-texto, #faf9f5);
}

.pagina-home__hero h1 {
  font-family: var(--fonte-titulo);
  font-size: var(--escala-xxl, 3.25rem);
  /* Achado do QA em produção, 22/09/2026: sem esta linha, a regra global
     "h1 { color: var(--cor-titulo-texto) }" de base.css vence a herança
     do pai acima, porque herança nunca ganha de uma declaração explícita
     no próprio elemento. O hero fica sobre o FundoAnimado (fundo sempre
     escuro nos dois temas), e --cor-titulo-texto no tema claro é escuro:
     contraste medido 1,09:1 a 1,24:1, título quase invisível. */
  color: var(--cor-hero-texto, #faf9f5);
}

.pagina-home__lista {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding: var(--esp-6, 2rem);
  display: grid;
  gap: var(--esp-5, 1.5rem);
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
</style>
