<script setup lang="ts">
import { computed } from 'vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import { resolverRota } from '@/app/curriculo/resolverRota';
import { ROTULOS_ABA } from '@/app/curriculo/rotulosAba';

const props = defineProps<{
  curriculo: Curriculo;
  /** Caminho da rota atual (sem barra inicial), mesmo formato de MenuCurriculo. */
  caminhoAtual: string;
}>();

interface ItemTrilha {
  readonly rotulo: string;
  readonly href: string;
}

function hrefAba(periodoId: string, cadeiraId: string, unidadeId: string, aba: string): string {
  const base = `/p/${periodoId}/${cadeiraId}/${unidadeId}`;
  return aba === 'resumo' ? base : `${base}/${aba}`;
}

/**
 * Trilha construída a partir do currículo real, pela mesma resolverRota
 * pura que já resolve URL contra a árvore em outro lugar do produto
 * (core/curriculo/resolverRota.ts) — nunca rótulo escrito à mão. Fora de
 * uma página de unidade (home, busca, período/cadeira em branco, URL
 * inexistente), a trilha cai para um único item com o nome do produto.
 */
const itens = computed<ItemTrilha[]>(() => {
  const resolucao = resolverRota(props.curriculo, props.caminhoAtual);

  if (resolucao.tipo === 'encontrado') {
    const { periodo, cadeira, unidade, aba } = resolucao;
    return [
      { rotulo: periodo.rotulo, href: `/p/${periodo.id}` },
      { rotulo: cadeira.nome, href: `/p/${periodo.id}/${cadeira.id}` },
      { rotulo: unidade.rotulo, href: `/p/${periodo.id}/${cadeira.id}/${unidade.id}` },
      { rotulo: ROTULOS_ABA[aba], href: hrefAba(periodo.id, cadeira.id, unidade.id, aba) }
    ];
  }

  if (resolucao.tipo === 'em-breve') {
    const { periodo, cadeira, unidade } = resolucao;
    const parcial: ItemTrilha[] = [{ rotulo: periodo.rotulo, href: `/p/${periodo.id}` }];
    if (cadeira) parcial.push({ rotulo: cadeira.nome, href: `/p/${periodo.id}/${cadeira.id}` });
    if (unidade) {
      parcial.push({
        rotulo: unidade.rotulo,
        href: `/p/${periodo.id}/${cadeira!.id}/${unidade.id}`
      });
    }
    return parcial;
  }

  return [{ rotulo: 'Caderno de Direito', href: '/' }];
});
</script>

<template>
  <nav aria-label="Trilha de navegação" class="trilha-navegacao">
    <ol :data-truncavel="itens.length > 2 ? 'true' : 'false'">
      <li v-for="(item, indice) in itens" :key="`${item.href}-${indice}`">
        <a :href="item.href" :aria-current="indice === itens.length - 1 ? 'page' : undefined">
          {{ item.rotulo }}
        </a>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.trilha-navegacao ol {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  min-width: 0;
  flex-wrap: nowrap;
  overflow: hidden;
}

.trilha-navegacao li {
  display: flex;
  align-items: center;
  white-space: nowrap;
  min-width: 0;
}

.trilha-navegacao li:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trilha-navegacao li + li::before {
  content: '/';
  margin: 0 var(--esp-2, 0.5rem);
  color: var(--cor-sidebar-texto-suave, #b8c0cc);
}

.trilha-navegacao a {
  color: var(--cor-sidebar-texto-suave, #b8c0cc);
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.trilha-navegacao a:hover {
  color: var(--cor-sidebar-texto, #faf9f5);
  text-decoration: underline;
}

.trilha-navegacao a:focus-visible {
  outline: 2px solid var(--cor-sidebar-texto, #faf9f5);
  outline-offset: 2px;
}

.trilha-navegacao a[aria-current='page'] {
  color: var(--cor-sidebar-texto, #faf9f5);
  font-weight: 600;
}

/* Tela estreita (LayoutBase.vue, mesmo ponto de quebra da gaveta):
   mostra só os dois últimos níveis, com reticências no que foi cortado,
   sem quebrar em duas linhas (ordem do líder, 22/09/2026, item 1). */
@media (max-width: 880px) {
  .trilha-navegacao ol[data-truncavel='true'] li:nth-last-child(n + 3) {
    display: none;
  }

  .trilha-navegacao ol[data-truncavel='true'] li:nth-last-child(2)::before {
    content: '\2026' !important;
    margin: 0 var(--esp-2, 0.5rem) 0 0;
  }

  .trilha-navegacao ol[data-truncavel='true'] li:nth-last-child(2) + li::before {
    content: '/';
  }
}
</style>
