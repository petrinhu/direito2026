<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { caminhoEmAreaRestrita } from '@/app/curriculo/areaRestrita';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { RepositorioProgresso } from '@/core/progresso/tipos';
import type { StoreTema } from '@/app/stores/tema';
import type { StoreBusca } from '@/app/stores/busca';
import type { StoreModoAdaptado } from '@/app/stores/modoAdaptado';
import BarraTopo from './BarraTopo.vue';
import Rodape from './Rodape.vue';
import MenuCurriculo from '../componentes/MenuCurriculo.vue';
import AvisoArmazenamento from '../componentes/AvisoArmazenamento.vue';
import QuadroProva from '../componentes/QuadroProva.vue';

const props = withDefaults(
  defineProps<{
    curriculo: Curriculo;
    caminhoAtual: string;
    repositorio: RepositorioProgresso;
    storeTema: StoreTema;
    storeBusca: StoreBusca;
    storeModoAdaptado: StoreModoAdaptado;
    /**
     * Faixa de topo: a página (só a inicial) preenche por Teleport o alvo
     * `#faixa-do-layout`, de lado a lado, logo abaixo do cabeçalho e por cima
     * da coluna da barra lateral. Sem a faixa, o layout fica como sempre.
     */
    comFaixa?: boolean;
  }>(),
  { comFaixa: false }
);

// O aviso diz que o site não usa cookies nem servidor: na área restrita isso é falso
// (há cookie de sessão e API), e ele cobriria o login. Lá ele não aparece.
const emAreaRestrita = computed(() => caminhoEmAreaRestrita(props.curriculo, props.caminhoAtual));

const emit = defineEmits<{ buscar: [string] }>();

const gavetaAberta = ref(false);
const gavetaRef = ref<HTMLElement | undefined>();

// Pendência da onda (não fazia parte da especificação original): com a
// gaveta aberta em tela estreita, o foco do teclado não pode escapar para
// o conteúdo atrás dela (WCAG 2.4.3 Ordem de foco / prática de diálogo
// modal do WAI-ARIA Authoring Practices), e fechar devolve o foco a quem
// abriu, nunca deixa o foco "perdido" no topo da página.
const SELETOR_FOCAVEL = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
let elementoAntesDeAbrir: HTMLElement | null = null;

function elementosFocaveis(): HTMLElement[] {
  if (!gavetaRef.value) return [];
  return Array.from(gavetaRef.value.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL));
}

function abrirGaveta(): void {
  elementoAntesDeAbrir = document.activeElement as HTMLElement | null;
  gavetaAberta.value = true;
  nextTick(() => {
    elementosFocaveis()[0]?.focus();
  });
}

function fecharGaveta(): void {
  gavetaAberta.value = false;
  elementoAntesDeAbrir?.focus();
  elementoAntesDeAbrir = null;
}

function aoTeclaNaGaveta(evento: KeyboardEvent): void {
  if (evento.key === 'Escape') {
    fecharGaveta();
    return;
  }
  if (evento.key !== 'Tab') return;

  const focaveis = elementosFocaveis();
  if (focaveis.length === 0) {
    evento.preventDefault();
    return;
  }
  const primeiro = focaveis[0]!;
  const ultimo = focaveis[focaveis.length - 1]!;
  if (evento.shiftKey && document.activeElement === primeiro) {
    evento.preventDefault();
    ultimo.focus();
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault();
    primeiro.focus();
  }
}
</script>

<template>
  <a href="#conteudo-principal" class="layout-base__pular">Pular para o conteúdo</a>
  <BarraTopo
    :curriculo="curriculo"
    :caminho-atual="caminhoAtual"
    :store-tema="storeTema"
    :store-busca="storeBusca"
    :store-modo-adaptado="storeModoAdaptado"
    @abrir-gaveta="abrirGaveta"
    @buscar="(termo) => emit('buscar', termo)"
  />
  <div v-if="comFaixa" id="faixa-do-layout" class="layout-base__faixa" />
  <div class="layout-base__corpo" :class="{ 'layout-base__corpo--com-faixa': comFaixa }">
    <div v-if="gavetaAberta" class="layout-base__sobreposicao" @click="fecharGaveta" />
    <aside
      ref="gavetaRef"
      class="layout-base__gaveta"
      :class="{ 'layout-base__gaveta--aberta': gavetaAberta }"
      @keydown="aoTeclaNaGaveta"
    >
      <MenuCurriculo :curriculo="curriculo" :caminho-atual="caminhoAtual" />
    </aside>
    <main id="conteudo-principal" tabindex="-1" class="layout-base__conteudo">
      <slot />
    </main>
  </div>
  <Rodape :repositorio="repositorio" />
  <!--
    Pilha inferior: aviso de armazenamento e quadro de contagem. Os dois são
    sticky dentro desta caixa (que é sticky no fim do documento), então ficam
    empilhados e nunca se sobrepõem nem cobrem o conteúdo do fim da página.
  -->
  <div class="layout-base__inferior">
    <AvisoArmazenamento v-if="!emAreaRestrita" :repositorio="repositorio" />
    <QuadroProva />
  </div>
</template>

<style scoped>
.layout-base__pular {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  background: var(--cor-fundo-elevado, #fff);
  padding: var(--esp-3, 0.75rem);
}

.layout-base__pular:focus {
  left: var(--esp-3, 0.75rem);
  top: var(--esp-3, 0.75rem);
}

.layout-base__corpo {
  display: flex;
  /* BarraTopo.vue virou position:fixed (cabeçalho recolhível, ordem do
     líder, 22/09/2026): sem este respiro o conteúdo nasceria coberto
     pela faixa. A folga extra (esp-2) absorve a onda + o fio de
     progresso, que ficam pendurados um pouco abaixo do cabeçalho. */
  padding-top: calc(var(--altura-cabecalho, 64px) + var(--esp-2, 0.5rem));
}

.layout-base__gaveta {
  width: var(--largura-sidebar, 280px);
  flex-shrink: 0;
  /* Par dedicado da lateral (achado do líder, 22/09/2026): fundo escuro
     nos dois temas, por desenho, então nunca uma variável que inverte
     com o tema (--cor-primaria-escura e --cor-texto-invertido colapsavam
     no mesmo valor no tema escuro, texto sumindo). */
  background: var(--cor-sidebar-fundo, #0d2440);
  color: var(--cor-sidebar-texto, #faf9f5);
  min-height: 100dvh;
  min-height: 100vh;
}

.layout-base__conteudo {
  flex: 1;
  min-width: 0;
}

/* Pilha inferior (aviso de armazenamento + quadro de contagem). Sticky e no
   fluxo do documento: reserva a própria altura no fim da página, como o aviso
   fazia sozinho antes. pointer-events: none deixa passar o clique pelo vão
   transparente; os filhos reativam o próprio toque. */
.layout-base__inferior {
  position: sticky;
  bottom: var(--esp-4, 1rem);
  z-index: 70;
  display: flex;
  flex-direction: column;
  gap: var(--esp-3, 0.75rem);
  pointer-events: none;
}

.layout-base__inferior > * {
  pointer-events: auto;
}

.layout-base__sobreposicao {
  display: none;
}

/* Faixa de topo (só com comFaixa): a faixa já começa abaixo do cabeçalho, então
   a grade não precisa do respiro de cima. A barra lateral nasce na base da faixa
   e fica presa logo abaixo do cabeçalho ao rolar (sticky), como no protótipo
   aprovado. Só em tela larga: em tela estreita a gaveta continua fixa (regra
   abaixo, mesmo ponto de quebra de 880px). */
.layout-base__faixa {
  /* A faixa começa no topo do documento, por baixo do cabeçalho fixo: o
     respiro de cima é a altura do cabeçalho, para o conteúdo da página nunca
     nascer escondido atrás dele. */
  padding-top: var(--altura-cabecalho, 64px);
}

.layout-base__corpo--com-faixa {
  padding-top: 0;
}

@media (min-width: 881px) {
  .layout-base__corpo--com-faixa .layout-base__gaveta {
    position: sticky;
    top: var(--altura-cabecalho, 64px);
    align-self: flex-start;
    min-height: 0;
    height: calc(100vh - var(--altura-cabecalho, 64px));
    height: calc(100dvh - var(--altura-cabecalho, 64px));
    overflow-y: auto;
  }
}

@media (max-width: 880px) {
  .layout-base__gaveta {
    position: fixed;
    inset-block: 0;
    left: 0;
    transform: translateX(-100%);
    transition: transform var(--transicao-rapida, 150ms ease);
    z-index: 90;
    overflow-y: auto;
  }

  .layout-base__gaveta--aberta {
    transform: translateX(0);
  }

  .layout-base__sobreposicao {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 80;
  }
}

/* Achado 2 da revisão (docs/revisao-modo-adaptado.md): a transição da
   gaveta em tela estreita nunca era desligada, nem pelo modo adaptado nem
   por prefers-reduced-motion, apesar de a especificação (docs/modo-
   adaptado.md, seção 6) e a media query de movimento reduzido do resto do
   site pedirem os dois. Mesmo padrão já usado em BarraTopo.vue (seletor
   :root[data-modo-adaptado='on'], que o compilador scoped do Vue deixa
   fora da escopagem por ser ancestral, não o elemento do próprio
   componente). */
@media (max-width: 880px) {
  :root[data-modo-adaptado='on'] .layout-base__gaveta {
    transition: none;
  }
}

@media (max-width: 880px) and (prefers-reduced-motion: reduce) {
  .layout-base__gaveta {
    transition: none;
  }
}

@media print {
  .layout-base__gaveta {
    display: none;
  }

  .layout-base__inferior {
    display: none;
  }
}
</style>
