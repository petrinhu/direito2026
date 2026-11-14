<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
import AvisoLegal from '../componentes/AvisoLegal.vue';
import QuadroProva from '../componentes/QuadroProva.vue';
import BotaoHome from '../componentes/BotaoHome.vue';

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
    /** Login de quem está logado (bloco da conta do menu); vazio = ninguém. */
    usuario?: string;
    /** Administrador vê Gerenciar usuários no menu. */
    admin?: boolean;
  }>(),
  { comFaixa: false, usuario: '', admin: false }
);

// Aviso legal e quadro de prova não aparecem na área restrita. O aviso de
// armazenamento aparece em todo o site: o texto dele vale nas duas áreas (LU-F3.5).
const emAreaRestrita = computed(() => caminhoEmAreaRestrita(props.curriculo, props.caminhoAtual));

// A página inicial tem caminho vazio (App.vue passa route.path sem a barra inicial).
// Lá o botão Home não aparece: a própria página já é a home.
const naPaginaInicial = computed(() => props.caminhoAtual === '');
// Na página do calendário o quadro de contagem começa minimizado, sem escolha
// gravada (ordem do orquestrador, para ratificação do líder, 20/10/2026).
const naPaginaDoCalendario = computed(() => props.caminhoAtual === 'calendario');
// No modo adaptado o quadro de prova não flutua: vai para o topo da coluna de conteúdo, em espaço
// próprio do fluxo (AV3-F0f, decisão do CPO a ratificar pelo líder). É a mesma instância, só muda o
// lugar, por Teleport. Fora do modo, o quadro segue na pilha inferior, como sempre.
const cartaoNoConteudo = computed(() => props.storeModoAdaptado.efetivo.value);

const emit = defineEmits<{ buscar: [string]; sair: [] }>();

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

/**
 * Fechar por navegação (link do menu ou Voltar do navegador) não devolve o foco ao botão de
 * abrir: a troca de rota já leva o foco ao conteúdo da página nova (router, afterEach), e
 * devolvê-lo aqui disputaria com esse passo (AV3-F0e).
 */
function fecharPorNavegacao(): void {
  gavetaAberta.value = false;
  elementoAntesDeAbrir = null;
}

/** Link da página atual não troca de rota, então não muda caminhoAtual: o clique cobre esse caso. */
function aoCliqueNaGaveta(evento: MouseEvent): void {
  if (evento.target instanceof window.Element && evento.target.closest('a[href]')) {
    fecharPorNavegacao();
  }
}

watch(
  () => props.caminhoAtual,
  () => {
    if (gavetaAberta.value) fecharPorNavegacao();
  }
);

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

/**
 * Recuo de rolagem pela pilha inferior (quadro de contagem e botão Home). A pilha é sticky e
 * fica 16 px acima da base da janela (--esp-4), então cobre a altura dela mais essa folga. O
 * recuo de 8 px a mais é o respiro. Assim o campo focado, rolado para a vista, nunca fica
 * escondido atrás da pilha (WCAG 2.4.11, técnica C43). Decisão do líder: "nunca cobre campo nem
 * menu" (07/11/2026), executada como opção A, para ratificação (L-15).
 */
const FOLGA_DE_BAIXO_PX = 16;
const RESPIRO_PX = 8;
const pilhaRef = ref<HTMLElement>();
let observadorPilha: InstanceType<typeof window.ResizeObserver> | undefined;

function publicarRecuoDaPilha(altura: number): void {
  document.documentElement.style.scrollPaddingBottom =
    altura > 0 ? `${altura + FOLGA_DE_BAIXO_PX + RESPIRO_PX}px` : '';
}

onMounted(() => {
  const pilha = pilhaRef.value;
  if (!pilha) return;
  publicarRecuoDaPilha(pilha.offsetHeight);
  if (typeof window.ResizeObserver === 'function') {
    observadorPilha = new window.ResizeObserver(() => publicarRecuoDaPilha(pilha.offsetHeight));
    observadorPilha.observe(pilha);
  }
});

onBeforeUnmount(() => {
  observadorPilha?.disconnect();
  observadorPilha = undefined;
  document.documentElement.style.removeProperty('scroll-padding-bottom');
});
</script>

<template>
  <a href="#conteudo-principal" class="layout-base__pular">Pular para o conteúdo</a>
  <BarraTopo
    :curriculo="curriculo"
    :caminho-atual="caminhoAtual"
    :store-tema="storeTema"
    :store-busca="storeBusca"
    :store-modo-adaptado="storeModoAdaptado"
    :na-pagina-inicial="naPaginaInicial"
    :gaveta-aberta="gavetaAberta"
    @abrir-gaveta="abrirGaveta"
    @buscar="(termo) => emit('buscar', termo)"
  />
  <!--
    Topo do conteúdo, logo abaixo da barra: o aviso de armazenamento vem primeiro (decisão do líder,
    07/11/2026: bloco no alto da página, que rola com ela), e depois a faixa da página inicial. O
    recuo do cabeçalho fixo está aqui, não na faixa nem no corpo.
  -->
  <div class="layout-base__topo">
    <AvisoArmazenamento :repositorio="repositorio" />
    <div v-if="comFaixa" id="faixa-do-layout" class="layout-base__faixa" />
  </div>
  <div class="layout-base__corpo" :class="{ 'layout-base__corpo--com-faixa': comFaixa }">
    <div v-if="gavetaAberta" class="layout-base__sobreposicao" @click="fecharGaveta" />
    <aside
      id="gaveta-do-curriculo"
      ref="gavetaRef"
      class="layout-base__gaveta"
      :class="{ 'layout-base__gaveta--aberta': gavetaAberta }"
      @keydown="aoTeclaNaGaveta"
      @click="aoCliqueNaGaveta"
    >
      <MenuCurriculo
        :curriculo="curriculo"
        :caminho-atual="caminhoAtual"
        :usuario="usuario"
        :admin="admin"
        @sair="emit('sair')"
      />
    </aside>
    <main id="conteudo-principal" tabindex="-1" class="layout-base__conteudo">
      <!-- Alvo do quadro de prova no modo adaptado. Fica vazio, sem altura, fora dele. -->
      <div id="quadro-prova-do-conteudo" class="layout-base__quadro-do-conteudo" />
      <slot />
    </main>
  </div>
  <!--
    Aviso legal (ordem do líder, 20/10/2026): fica FORA do Rodape de propósito,
    porque o rodapé some na impressão (display:none em @media print) e o aviso
    tem de aparecer no papel. Mesmo critério de área restrita do quadro: não
    aparece na cadeira Interdisciplinar.
  -->
  <AvisoLegal v-if="!emAreaRestrita" />
  <Rodape :repositorio="repositorio" />
  <!--
    Pilha inferior: quadro de contagem e botão Home. Os dois são sticky dentro desta caixa (que é
    sticky no fim do documento), então ficam empilhados e nunca se sobrepõem nem cobrem o conteúdo
    do fim da página. O botão Home vai por último, no canto inferior direito, abaixo do quadro.
  -->
  <div ref="pilhaRef" class="layout-base__inferior">
    <!-- O quadro de prova não aparece na área restrita (ordem do líder, 20/10/2026). -->
    <Teleport to="#quadro-prova-do-conteudo" :disabled="!cartaoNoConteudo">
      <QuadroProva v-if="!emAreaRestrita" :minimizado-por-padrao="naPaginaDoCalendario" />
    </Teleport>
    <BotaoHome v-if="!naPaginaInicial" />
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
  padding-top: var(--esp-2, 0.5rem);
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

/* Pilha inferior (quadro de contagem + botão Home). Sticky e no fluxo do documento: reserva a
   própria altura no fim da página. pointer-events: none deixa passar o clique pelo vão
   transparente; os filhos reativam o próprio toque. */
/* z-index 50: abaixo da barra do topo (60), do véu da gaveta (80) e da gaveta (90), para que a
   pilha nunca cubra os controles do cabeçalho e do menu (QA F5.1). */
.layout-base__inferior {
  position: sticky;
  bottom: var(--esp-4, 1rem);
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: var(--esp-3, 0.75rem);
  pointer-events: none;
}

.layout-base__inferior > * {
  pointer-events: auto;
}

/* Botão Home: canto inferior direito da pilha, alinhado à mesma margem direita
   do quadro de contagem. Fica sempre abaixo do quadro (em 1280 e em 390), então
   os dois nunca se sobrepõem. */
.layout-base__inferior > .botao-home {
  align-self: flex-end;
  margin-right: var(--esp-4, 1rem);
}

.layout-base__sobreposicao {
  display: none;
}

/* Alvo do quadro de prova: só ganha altura no modo adaptado, quando o quadro chega dentro dele. O
   respiro até o conteúdo abaixo é o mesmo espaço entre blocos (AV3-F0f). */
:root[data-modo-adaptado='on'] .layout-base__quadro-do-conteudo:not(:empty) {
  padding-bottom: var(--esp-4, 1rem);
}

/* Topo do conteúdo: o respiro de cima é a altura do cabeçalho fixo, para o aviso e a faixa
   nunca nascerem escondidos atrás da barra. Antes, esse respiro ficava no corpo e na faixa. */
.layout-base__topo {
  padding-top: var(--altura-cabecalho, 64px);
}

/* Faixa de topo (só com comFaixa): a grade começa logo abaixo dela. A barra lateral nasce na base
   da faixa e fica presa logo abaixo do cabeçalho ao rolar (sticky), como no protótipo aprovado. Só
   em tela larga: em tela estreita a gaveta continua fixa (regra abaixo, mesmo ponto de quebra de
   880px). */
.layout-base__faixa {
  min-width: 0;
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
