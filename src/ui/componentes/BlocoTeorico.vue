<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { BlocoResumo } from '@/core/unidade/tipos';
import QuadroResumo from './QuadroResumo.vue';
import ChecklistArt319 from './ChecklistArt319.vue';
import CartoesCincoPerguntas from './CartoesCincoPerguntas.vue';
import DicasFormaProfessora from './DicasFormaProfessora.vue';

const props = withDefaults(
  defineProps<{ bloco: BlocoResumo; itensChecklistMarcados?: readonly string[] }>(),
  { itensChecklistMarcados: () => [] }
);
const emit = defineEmits<{ lido: [string]; 'alternar-item-checklist': [string] }>();

const raizRef = ref<HTMLElement | undefined>();
let observador: IntersectionObserver | undefined;

onMounted(() => {
  const elemento = raizRef.value;
  if (!elemento || typeof IntersectionObserver === 'undefined') return;
  observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) {
          emit('lido', props.bloco.id);
          observador?.disconnect();
        }
      }
    },
    { threshold: 0.6 }
  );
  observador.observe(elemento);
});

onBeforeUnmount(() => observador?.disconnect());
</script>

<template>
  <section :id="bloco.id" ref="raizRef" class="bloco-teorico">
    <header class="bloco-teorico__cabecalho">
      <span class="bloco-teorico__numero">Bloco {{ bloco.numero }}</span>
      <span v-if="bloco.badge" class="bloco-teorico__badge">{{ bloco.badge }}</span>
    </header>
    <h2 class="bloco-teorico__titulo">{{ bloco.titulo }}</h2>
    <p v-if="bloco.fonte.length > 0" class="bloco-teorico__fonte">{{ bloco.fonte }}</p>
    <!-- v-html só recebe corpoHtml, que vem de src/conteudo/ (seção 4.4). -->
    <div class="bloco-teorico__corpo" v-html="bloco.corpoHtml" />
    <!-- Extensão opcional (Área da Júri: linhas A e B, fontes). Sem conteúdo no slot, nada muda. -->
    <slot name="depois-do-corpo" />
    <ChecklistArt319
      v-if="bloco.componenteExtra === 'checklist-art-319'"
      :marcados="itensChecklistMarcados"
      @alternar="emit('alternar-item-checklist', $event)"
    />
    <CartoesCincoPerguntas v-else-if="bloco.componenteExtra === 'cartoes-cinco-perguntas'" />
    <DicasFormaProfessora v-else-if="bloco.componenteExtra === 'dicas-forma-professora'" />
    <QuadroResumo :itens="bloco.resumo" />
    <p v-if="bloco.exemploHtml.length > 0" class="bloco-teorico__exemplo">
      <strong>Na prática do operador do direito:</strong>{{ ' '
      }}<span v-html="bloco.exemploHtml" />
    </p>
  </section>
</template>

<style scoped>
.bloco-teorico {
  max-width: var(--largura-coluna-leitura, 760px);
  margin-inline: auto;
  padding-block: var(--esp-7, 3rem);
  break-before: page;
  page-break-before: always;
}

.bloco-teorico__cabecalho {
  display: flex;
  gap: var(--esp-2, 0.5rem);
  align-items: center;
}

.bloco-teorico__numero {
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-primaria, #163a5f);
  text-transform: uppercase;
}

.bloco-teorico__badge {
  font-size: var(--escala-xs, 0.8125rem);
  background: var(--cor-acento-claro, #f3ead1);
  color: var(--cor-acento, #8a6d1f);
  border-radius: var(--raio-sm, 6px);
  padding: 0.05rem 0.5rem;
}

.bloco-teorico__titulo {
  font-family: var(--fonte-titulo);
  font-variant-numeric: lining-nums;
}

.bloco-teorico__corpo :deep(p) {
  line-height: var(--altura-linha-texto, 1.7);
}

.bloco-teorico__corpo :deep(button.citacao) {
  background: none;
  border: none;
  border-bottom: 1px dashed var(--cor-primaria, #163a5f);
  color: var(--cor-primaria, #163a5f);
  font: inherit;
  cursor: pointer;
  padding: 0;
}

/*
  Palavra sem ponto de quebra (ex.: "incondicionalmente" num item da lista) é
  mais larga que a caixa na leitura ampliada (24px e espaçamento de letra do
  modo) e passava da tela: a página rolava 358px contra 320px. overflow-wrap:
  break-word só parte a palavra que não cabe, e é herdado por parágrafos, itens
  e legendas do corpo. Mesmo critério das células de tabela, abaixo.
*/
.bloco-teorico__corpo {
  overflow-wrap: break-word;
}

/*
  A tabela do resumo cabe na largura do quadro em desktop e tablet, sem
  barra de rolagem. Antes, `table { min-width: max-content }` forçava a
  tabela à largura de uma linha só (1512px em 1280px) e o quadro rolava
  sempre. Agora a tabela ocupa 100% e as células quebram linha normal;
  overflow-wrap: break-word só atua quando uma palavra não cabe na célula
  (anywhere mudaria o cálculo de largura mínima e partiria palavras comuns).

  Rolagem horizontal só no celular (<= 640px), com sombra na borda como
  dica de que há mais conteúdo para o lado: dois fundos, um preso ao
  CONTEÚDO (local, anda com o scroll) que mascara o outro, preso ao QUADRO
  (scroll, fica parado). Sem JavaScript; some quando não há mais conteúdo.
*/
.bloco-teorico__corpo :deep(.tabela-rolavel) {
  min-width: 0;
  margin-block: var(--esp-4, 1rem);
}

.bloco-teorico__corpo :deep(.tabela-rolavel):focus-visible {
  outline: 2px solid var(--cor-primaria, #163a5f);
  outline-offset: -2px;
}

.bloco-teorico__corpo :deep(table) {
  border-collapse: collapse;
  width: 100%;
  font-size: var(--escala-sm, 0.9375rem);
}

.bloco-teorico__corpo :deep(th),
.bloco-teorico__corpo :deep(td) {
  border: 1px solid var(--cor-borda, #dcd7c8);
  padding: var(--esp-1, 0.25rem) var(--esp-2, 0.5rem);
  text-align: left;
  vertical-align: top;
  white-space: normal;
  overflow-wrap: break-word;
}

.bloco-teorico__corpo :deep(th) {
  background: var(--cor-fundo-sutil, #f2efe6);
  font-family: var(--fonte-titulo);
  font-variant-numeric: lining-nums;
}

@media (max-width: 640px) {
  .bloco-teorico__corpo :deep(.tabela-rolavel) {
    overflow-x: auto;
    background:
      linear-gradient(to right, var(--cor-fundo-elevado, #fff) 30%, rgba(255, 255, 255, 0)) local,
      linear-gradient(to left, var(--cor-fundo-elevado, #fff) 30%, rgba(255, 255, 255, 0)) local
        100% 0,
      radial-gradient(farthest-side at 0 50%, rgba(13, 36, 64, 0.18), rgba(255, 255, 255, 0)) scroll,
      radial-gradient(farthest-side at 100% 50%, rgba(13, 36, 64, 0.18), rgba(255, 255, 255, 0))
        scroll 100% 0;
    background-repeat: no-repeat;
    background-color: var(--cor-fundo-elevado, #fff);
    background-size:
      40px 100%,
      40px 100%,
      14px 100%,
      14px 100%;
  }
}

@media print {
  /* Na impressão não existe rolagem: a tabela aparece inteira, mesmo que
     precise reduzir a fonte ou quebrar linha nas células. */
  .bloco-teorico__corpo :deep(.tabela-rolavel) {
    overflow-x: visible;
    background: none;
  }
}
</style>
