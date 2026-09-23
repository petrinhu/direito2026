<script setup lang="ts">
import { computed, inject } from 'vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import CartaoUnidade from '../componentes/CartaoUnidade.vue';
import EstadoEmBreve from '../componentes/EstadoEmBreve.vue';

const props = defineProps<{ periodo: string; cadeira: string }>();
const curriculo = inject(CHAVE_CURRICULO)!;

const periodo = computed(() => curriculo.find((p) => p.id === props.periodo));
const cadeira = computed(() => periodo.value?.cadeiras.find((c) => c.id === props.cadeira));
</script>

<template>
  <div v-if="cadeira" class="pagina-cadeira">
    <h1>{{ cadeira.nome }}</h1>
    <section class="pagina-cadeira__lista">
      <CartaoUnidade
        v-for="unidade in cadeira.unidades"
        :key="unidade.id"
        :periodo="periodo!"
        :cadeira="cadeira"
        :unidade="unidade"
        :href="`/p/${periodo!.id}/${cadeira.id}/${unidade.id}`"
      />
    </section>
  </div>
  <EstadoEmBreve v-else rotulo="Cadeira não encontrada" />
</template>

<style scoped>
.pagina-cadeira {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding: var(--esp-6, 2rem);
}

.pagina-cadeira__lista {
  display: grid;
  gap: var(--esp-5, 1.5rem);
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
</style>
