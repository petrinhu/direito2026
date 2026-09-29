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

/*
  Modo normal: a página atual (último item) sempre aparece; o que não cabe
  com largura legível SAI DA ÁRVORE (display:none, por consulta de contêiner
  na própria trilha), em vez de encolher até 0px. Link espremido a 0px
  continuaria na ordem de Tab sem ficar visível, e foco invisível reprova
  WCAG 2.4.7 e 2.4.11 (achado do líder, 29/09/2026). COSMÉTICO 2 do QA
  (docs/qa-conserto-cabecalho-quiz.md): o <a> era inline-flex (texto em item
  anônimo, onde text-overflow não age) e o texto era cortado seco; agora é
  bloco de uma linha com reticências.

  Larguras por construção, sem JS: cada intermediário mede no máximo 9rem de
  link mais a barra (~10,5rem) e a página atual no máximo 10rem, todos sem
  encolher. As consultas abaixo só deixam aparecer quantos intermediários
  cabem somando esses máximos: 21rem para 1, 32rem para 2, 42rem para 3
  (a "página atual" sozinha cabe em qualquer largura, a caixa tem no mínimo
  8rem, BarraTopo.vue). O modo adaptado quebra em várias linhas e nunca
  trunca (bloco abaixo).
*/
.trilha-navegacao {
  container-type: inline-size;
}

:root:not([data-modo-adaptado='on']) .trilha-navegacao li {
  flex: 0 0 auto;
  min-width: 0;
}

:root:not([data-modo-adaptado='on']) .trilha-navegacao li:last-child {
  max-width: min(100%, 10rem);
}

:root:not([data-modo-adaptado='on']) .trilha-navegacao a {
  display: block;
  line-height: 44px;
  min-width: 0;
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:root:not([data-modo-adaptado='on']) .trilha-navegacao li:last-child a {
  max-width: 100%;
}

/* O primeiro item que continua visível leva "…" no lugar da barra, para a
   pessoa saber que há níveis omitidos (mesma marca do corte de tela estreita
   acima). :not(:first-child) evita a marca quando nada foi omitido. */
@container (max-width: 20.99rem) {
  :root:not([data-modo-adaptado='on']) .trilha-navegacao li:not(:last-child) {
    display: none;
  }

  :root:not([data-modo-adaptado='on']) .trilha-navegacao li:last-child:not(:first-child)::before {
    content: '\2026';
  }
}

@container (min-width: 21rem) and (max-width: 31.99rem) {
  :root:not([data-modo-adaptado='on']) .trilha-navegacao li:nth-last-child(n + 3) {
    display: none;
  }

  :root:not([data-modo-adaptado='on'])
    .trilha-navegacao
    li:nth-last-child(2):not(:first-child)::before {
    content: '\2026';
  }
}

@container (min-width: 32rem) and (max-width: 41.99rem) {
  :root:not([data-modo-adaptado='on']) .trilha-navegacao li:nth-last-child(n + 4) {
    display: none;
  }

  :root:not([data-modo-adaptado='on'])
    .trilha-navegacao
    li:nth-last-child(3):not(:first-child)::before {
    content: '\2026';
  }
}

/* Críticos 1 e 2 do QA (docs/qa-modo-adaptado.md): com flex-wrap:nowrap e
   white-space:nowrap acima, o texto de cada item não cabia na caixa
   encolhida e PINTAVA POR CIMA do item vizinho (achado 1, qualquer
   largura), e na home (um item só) vazava pra fora da tela sem gerar
   rolagem (achado 2, mesma causa). docs/modo-adaptado.md §4 já pedia
   "quebra em mais de uma linha [...] nunca corta com reticências" para
   este exato componente sob o modo - nunca implementado. Este bloco
   sobrepõe tanto o nowrap padrão quanto o truncamento por reticências de
   tela estreita acima (que também corta, o que o modo proíbe), sempre
   que o modo estiver ligado, em qualquer largura. */
:root[data-modo-adaptado='on'] .trilha-navegacao ol {
  flex-wrap: wrap;
  overflow: visible;
}

:root[data-modo-adaptado='on'] .trilha-navegacao li {
  white-space: normal;
  overflow-wrap: anywhere;
}

:root[data-modo-adaptado='on'] .trilha-navegacao li:last-child {
  overflow: visible;
  text-overflow: clip;
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
