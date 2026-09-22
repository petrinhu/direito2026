<script setup lang="ts">
import { computed, inject } from 'vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import EstadoEmBreve from '../componentes/EstadoEmBreve.vue';

const props = defineProps<{ periodo: string }>();
const curriculo = inject(CHAVE_CURRICULO)!;

const periodo = computed(() => curriculo.find((p) => p.id === props.periodo));
</script>

<template>
  <div v-if="periodo" class="pagina-periodo">
    <h1>{{ periodo.rotulo }}</h1>
    <EstadoEmBreve v-if="periodo.cadeiras.length === 0" rotulo="Nenhuma cadeira publicada ainda" />
    <ul v-else>
      <li v-for="cadeira in periodo.cadeiras" :key="cadeira.id">
        <EstadoEmBreve v-if="cadeira.estado === 'em-breve'" :rotulo="cadeira.nome" />
        <a v-else :href="`/p/${periodo.id}/${cadeira.id}`">{{ cadeira.nome }}</a>
      </li>
    </ul>
  </div>
  <EstadoEmBreve v-else rotulo="Período não encontrado" />
</template>

<style scoped>
.pagina-periodo {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding: var(--esp-6, 2rem);
}

.pagina-periodo li a {
  /* Mesmo gêmeo do sumário do Resumo (VisorResumo.vue): `a` cru dentro de
     `li` fica `inline`, e min-height/min-width do `a` global (base.css)
     não se aplicam a inline. inline-flex faz o token de piso de alvo
     (tokens.css, --alvo-toque-minimo) valer: 24px fora do modo adaptado
     (igual ao que já vigora, sem esticar o desenho normal) e 44px dentro
     dele. */
  display: inline-flex;
  align-items: center;
  min-height: var(--alvo-toque-minimo, 24px);
  min-width: var(--alvo-toque-minimo, 24px);
  padding-block: var(--esp-1, 0.25rem);
}
</style>
