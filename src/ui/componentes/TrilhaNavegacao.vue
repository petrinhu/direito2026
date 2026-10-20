<script setup lang="ts">
import { computed } from 'vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import { resolverRota } from '@/app/curriculo/resolverRota';
import { ROTULOS_ABA } from '@/app/curriculo/rotulosAba';
import { rotuloSemViuva } from '@/app/curriculo/rotuloSemViuva';

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
      <li
        v-for="(item, indice) in itens"
        :key="`${item.href}-${indice}`"
        :class="{ 'trilha-navegacao__atual': indice === itens.length - 1 }"
      >
        <a :href="item.href" :aria-current="indice === itens.length - 1 ? 'page' : undefined">
          {{ rotuloSemViuva(item.rotulo) }}
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
  min-width: 0;
}

.trilha-navegacao li + li::before {
  content: '/';
  margin: 0 var(--esp-2, 0.5rem);
  color: var(--cor-sidebar-texto-suave, #b8c0cc);
}

.trilha-navegacao a {
  color: var(--cor-sidebar-texto-suave, #b8c0cc);
  text-decoration: none;
  /* Achado 3 da revisão: min-width nunca tinha sido conferido. */
  min-width: 44px;
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

/* Modo normal: a lista tem overflow:hidden e recortava o anel desenhado fora
   da caixa do link (o teclado via só uma barra de 2px, achado da rodada 3 do
   QA). Deslocamento negativo desenha o anel por dentro. O modo adaptado não
   recorta (overflow visível) e mantém o anel de fora. */
:root:not([data-modo-adaptado='on']) .trilha-navegacao a:focus-visible {
  outline-offset: -2px;
}

.trilha-navegacao a[aria-current='page'] {
  color: var(--cor-sidebar-texto, #faf9f5);
  font-weight: 600;
}

/* Tela estreita (LayoutBase.vue, mesmo ponto de quebra da gaveta): mostra
   só os dois últimos níveis, o penúltimo sem marca de corte. Nenhum nome é
   cortado com reticências (ordem do líder, cabeçalho em celular). */
@media (max-width: 880px) {
  .trilha-navegacao ol[data-truncavel='true'] li:nth-last-child(n + 3) {
    display: none;
  }

  .trilha-navegacao ol[data-truncavel='true'] li:nth-last-child(2)::before {
    content: none;
  }
}

/*
  Modo normal: nenhum nível é cortado. Cada item quebra em linhas quando o
  nome é longo, e a página atual (classe no li) ocupa o espaço que sobra
  para quebrar sem espremer. Os níveis que não cabem saem da árvore
  (display:none) em vez de encolher até 0px: link espremido a 0px continua
  na ordem de Tab sem ficar visível, e foco invisível reprova WCAG 2.4.7 e
  2.4.11 (achado do líder, 29/09/2026).

  As faixas de contêiner decidem só QUANTOS níveis aparecem, nunca cortam:
  cada intermediário mede o próprio texto e quebra se a faixa não couber.
  Em tela estreita o penúltimo nível ganha a primeira linha e a página
  atual a segunda, inteira, e nenhum deles leva barra ou marca no início da
  linha.
*/
:root:not([data-modo-adaptado='on']) .trilha-navegacao li {
  flex: 0 1 auto;
  min-width: 0;
}

:root:not([data-modo-adaptado='on']) .trilha-navegacao .trilha-navegacao__atual {
  flex: 1 1 auto;
}

:root:not([data-modo-adaptado='on']) .trilha-navegacao a {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 44px;
  line-height: 1.3;
  overflow-wrap: break-word;
  white-space: normal;
}

@container (max-width: 20.99rem) {
  :root:not([data-modo-adaptado='on']) .trilha-navegacao ol {
    flex-wrap: wrap;
  }

  :root:not([data-modo-adaptado='on']) .trilha-navegacao li:nth-last-child(n + 3) {
    display: none;
  }

  :root:not([data-modo-adaptado='on']) .trilha-navegacao li:nth-last-child(2)::before,
  :root:not([data-modo-adaptado='on']) .trilha-navegacao .trilha-navegacao__atual::before {
    content: none;
  }

  :root:not([data-modo-adaptado='on']) .trilha-navegacao .trilha-navegacao__atual {
    flex-basis: 100%;
  }
}

@container (min-width: 21rem) and (max-width: 31.99rem) {
  :root:not([data-modo-adaptado='on']) .trilha-navegacao li:nth-last-child(n + 3) {
    display: none;
  }

  :root:not([data-modo-adaptado='on']) .trilha-navegacao li:nth-last-child(2)::before {
    content: none;
  }
}

@container (min-width: 32rem) and (max-width: 41.99rem) {
  :root:not([data-modo-adaptado='on']) .trilha-navegacao li:nth-last-child(n + 4) {
    display: none;
  }

  :root:not([data-modo-adaptado='on']) .trilha-navegacao li:nth-last-child(3)::before {
    content: none;
  }
}

.trilha-navegacao {
  container-type: inline-size;
}

/* Modo adaptado: a trilha quebra em várias linhas e nunca corta. O nowrap e
   o corte do modo normal acima não se aplicam aqui (seletor :root:not), e
   este bloco desfaz o que sobrar do modo normal nos mesmos itens. */
:root[data-modo-adaptado='on'] .trilha-navegacao ol {
  flex-wrap: wrap;
  overflow: visible;
}

:root[data-modo-adaptado='on'] .trilha-navegacao li {
  white-space: normal;
  overflow-wrap: anywhere;
}

:root[data-modo-adaptado='on']
  .trilha-navegacao
  ol[data-truncavel='true']
  li:nth-last-child(n + 3) {
  display: flex;
}

:root[data-modo-adaptado='on']
  .trilha-navegacao
  ol[data-truncavel='true']
  li:nth-last-child(2)::before {
  content: '/' !important;
  margin: 0 var(--esp-2, 0.5rem);
}
</style>
