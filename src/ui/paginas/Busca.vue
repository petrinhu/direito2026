<script setup lang="ts">
import { inject, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { CHAVE_STORE_BUSCA } from '@/app/chaves';
import PainelResultadosBusca from '../componentes/PainelResultadosBusca.vue';

const storeBusca = inject(CHAVE_STORE_BUSCA)!;
const route = useRoute();

async function buscarDaQuery(): Promise<void> {
  const termo = typeof route.query.q === 'string' ? route.query.q : '';
  await storeBusca.garantirMotorCarregado();
  storeBusca.consultar(termo);
}

onMounted(buscarDaQuery);
watch(() => route.query.q, buscarDaQuery);
</script>

<template>
  <div class="pagina-busca">
    <h1>Busca</h1>
    <PainelResultadosBusca
      :resultados="storeBusca.resultados.value"
      :termo="storeBusca.termo.value"
    />
  </div>
</template>

<style scoped>
.pagina-busca {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding: var(--esp-6, 2rem);
}
</style>
