<script setup lang="ts">
import { inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CHAVE_CURRICULO, CHAVE_STORE_BUSCA, CHAVE_STORE_TEMA } from '@/app/chaves';
import LayoutBase from '@/ui/layout/LayoutBase.vue';

const curriculo = inject(CHAVE_CURRICULO)!;
const storeTema = inject(CHAVE_STORE_TEMA)!;
const storeBusca = inject(CHAVE_STORE_BUSCA)!;
const route = useRoute();
const router = useRouter();

function aoBuscar(termo: string): void {
  router.push({ path: '/busca', query: { q: termo } });
}
</script>

<template>
  <LayoutBase
    :curriculo="curriculo"
    :caminho-atual="route.path.replace(/^\//, '')"
    :store-tema="storeTema"
    :store-busca="storeBusca"
    @buscar="aoBuscar"
  >
    <router-view />
  </LayoutBase>
</template>
