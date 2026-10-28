<script setup lang="ts">
import { computed, inject, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  CHAVE_CURRICULO,
  CHAVE_REPOSITORIO,
  CHAVE_STORE_BUSCA,
  CHAVE_STORE_MODO_ADAPTADO,
  CHAVE_STORE_TEMA
} from '@/app/chaves';
import { caminhoSuspendeModoAdaptado } from '@/app/curriculo/areaRestrita';
import LayoutBase from '@/ui/layout/LayoutBase.vue';

const curriculo = inject(CHAVE_CURRICULO)!;
const repositorio = inject(CHAVE_REPOSITORIO)!;
const storeTema = inject(CHAVE_STORE_TEMA)!;
const storeBusca = inject(CHAVE_STORE_BUSCA)!;
const storeModoAdaptado = inject(CHAVE_STORE_MODO_ADAPTADO)!;
const route = useRoute();
const router = useRouter();

// Ordem do líder: sem modo adaptado na área restrita do Interdisciplinar. A Júri
// mantém o modo (decisão do CTO). A preferência salva fica como está; só o efeito
// é suspenso enquanto a rota for da área que suspende.
const suspendeModo = computed(() => caminhoSuspendeModoAdaptado(curriculo, route.path));
watch(suspendeModo, (valor) => storeModoAdaptado.suspender(valor), { immediate: true });

function aoBuscar(termo: string): void {
  router.push({ path: '/busca', query: { q: termo } });
}
</script>

<template>
  <LayoutBase
    :curriculo="curriculo"
    :caminho-atual="route.path.replace(/^\//, '')"
    :repositorio="repositorio"
    :store-tema="storeTema"
    :store-busca="storeBusca"
    :store-modo-adaptado="storeModoAdaptado"
    :com-faixa="route.meta.faixaDeTopo === true"
    @buscar="aoBuscar"
  >
    <router-view />
  </LayoutBase>
</template>
