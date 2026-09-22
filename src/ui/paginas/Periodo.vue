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
</style>
