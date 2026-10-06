<script setup lang="ts">
import { computed, defineAsyncComponent, inject } from 'vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import CartaoUnidade from '../componentes/CartaoUnidade.vue';
import EstadoEmBreve from '../componentes/EstadoEmBreve.vue';

// Só a cadeira restrita carrega esta página (e o CSS dela), em chunk à parte.
const AreaRestrita = defineAsyncComponent(() => import('./AreaRestrita.vue'));

const props = defineProps<{ periodo: string; cadeira: string }>();
const curriculo = inject(CHAVE_CURRICULO)!;

const periodo = computed(() => curriculo.find((p) => p.id === props.periodo));
const cadeira = computed(() => periodo.value?.cadeiras.find((c) => c.id === props.cadeira));
</script>

<template>
  <AreaRestrita v-if="cadeira?.restrita" />
  <div v-else-if="cadeira" class="pagina-cadeira">
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
