<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { StoreTema } from '@/app/stores/tema';
import type { StoreBusca } from '@/app/stores/busca';
import type { StoreModoAdaptado } from '@/app/stores/modoAdaptado';
import AlternadorTema from '../componentes/AlternadorTema.vue';
import BotaoModoAdaptado from '../componentes/BotaoModoAdaptado.vue';
import CampoBusca from '../componentes/CampoBusca.vue';
import TrilhaNavegacao from '../componentes/TrilhaNavegacao.vue';

const props = defineProps<{
  curriculo: Curriculo;
  caminhoAtual: string;
  storeTema: StoreTema;
  storeBusca: StoreBusca;
  storeModoAdaptado: StoreModoAdaptado;
}>();
const emit = defineEmits<{ 'abrir-gaveta': []; buscar: [string] }>();

/**
 * Cabeçalho que recolhe ao rolar para baixo e volta ao rolar para cima
 * (ordem do líder, 22/09/2026), fio de leitura (fração da página já
 * rolada) e fundo translúcido só depois que o leitor já rolou (a faixa
 * nasce sólida). Mesmo padrão já usado em FundoAnimado.vue e citacoes.ts
 * para prefers-reduced-motion: checagem única no setup, sem listener de
 * mudança ao vivo (ninguém troca essa preferência com a página aberta).
 */
const prefereMenosMovimento =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const oculta = ref(false);
const rolado = ref(false);
const fracaoLeitura = ref(0);
let ultimoScrollY = 0;

function calcularFracaoLeitura(): number {
  const altura = document.documentElement.scrollHeight - window.innerHeight;
  if (altura <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / altura));
}

function aoRolar(): void {
  const atual = window.scrollY;
  rolado.value = atual > 8;
  fracaoLeitura.value = calcularFracaoLeitura();

  // O modo adaptado soma-se a prefers-reduced-motion como motivo de nunca
  // recolher: o próprio botão do modo precisa continuar visível o tempo
  // todo (requisito do líder, "botão visível no cabeçalho, em toda
  // página"), e um cabeçalho que soma e some é movimento que o modo existe
  // para eliminar (docs/modo-adaptado.md, seção 6). Exceção registrada em
  // docs/modo-adaptado.md, seção 4.1: até 880px o cabeçalho do modo não é
  // fixo, então o botão fica no topo de cada página, não em toda rolagem.
  if (!prefereMenosMovimento && !props.storeModoAdaptado.efetivo.value) {
    // Limiar de 80px antes de recolher: evita esconder o cabeçalho por
    // um tremor mínimo de rolagem logo no topo da página.
    if (atual > ultimoScrollY && atual > 80) oculta.value = true;
    else if (atual < ultimoScrollY) oculta.value = false;
  }
  ultimoScrollY = atual;
}

/**
 * Item do cabeçalho recebendo foco por teclado nunca pode ficar escondido
 * atrás da faixa recolhida (requisito que não pode cair). `focusin`
 * borbulha, então um único listener na raiz cobre gaveta, trilha, busca
 * e alternador de tema.
 */
function aoReceberFoco(): void {
  oculta.value = false;
}

/**
 * Altura que LayoutBase.vue (padding-top) e base.css (scroll-padding-top)
 * reservam por baixo do cabeçalho fixo. O número escrito em tokens.css
 * (64px, 220px no modo adaptado) não acompanha o cabeçalho real quando ele
 * quebra em 2 ou 3 linhas em tela estreita (medido pelo QA: 433px reais
 * contra 220px reservados, título coberto), então o próprio cabeçalho
 * publica a altura que tem. Fora do fluxo fixo (modo adaptado em tela
 * estreita, ver o CSS abaixo) ele não cobre nada e não reserva nada.
 */
const raiz = ref<HTMLElement | null>(null);
let observadorDeTamanho: { disconnect: () => void } | undefined;

function publicarAlturaReservada(): void {
  const cabecalho = raiz.value;
  if (!cabecalho) return;
  const fixo = getComputedStyle(cabecalho).position === 'fixed';
  document.documentElement.style.setProperty(
    '--altura-cabecalho',
    fixo ? `${cabecalho.offsetHeight}px` : '0px'
  );
}

watch(() => props.storeModoAdaptado.efetivo.value, publicarAlturaReservada, { flush: 'post' });

onMounted(() => {
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', publicarAlturaReservada);
  aoRolar();
  publicarAlturaReservada();
  if (typeof window.ResizeObserver === 'function' && raiz.value) {
    const observador = new window.ResizeObserver(publicarAlturaReservada);
    observador.observe(raiz.value);
    observadorDeTamanho = observador;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', aoRolar);
  window.removeEventListener('resize', publicarAlturaReservada);
  observadorDeTamanho?.disconnect();
  document.documentElement.style.removeProperty('--altura-cabecalho');
});
</script>

<template>
  <header
    ref="raiz"
    class="barra-topo"
    :class="{
      'barra-topo--oculta': oculta,
      'barra-topo--rolado': rolado,
      'barra-topo--fixa': prefereMenosMovimento || props.storeModoAdaptado.efetivo.value
    }"
    @focusin="aoReceberFoco"
  >
    <div class="barra-topo__linha">
      <button
        type="button"
        class="barra-topo__botao-gaveta"
        aria-label="Abrir menu do currículo"
        @click="emit('abrir-gaveta')"
      >
        ☰
      </button>
      <TrilhaNavegacao
        :curriculo="props.curriculo"
        :caminho-atual="props.caminhoAtual"
        class="barra-topo__trilha"
      />
      <CampoBusca :store="storeBusca" @enviar="(termo) => emit('buscar', termo)" />
      <BotaoModoAdaptado v-if="!storeModoAdaptado.suspenso.value" :store="storeModoAdaptado" />
      <AlternadorTema :store="storeTema" />
    </div>

    <!--
      Base em onda (ordem do líder, 22/09/2026, item 3): curva suave e
      discreta em vez de corte reto, decorativa (aria-hidden,
      pointer-events:none — nunca captura clique do que está embaixo).
      Some na impressão junto com o resto do cabeçalho (@media print).
    -->
    <svg
      class="barra-topo__onda"
      aria-hidden="true"
      preserveAspectRatio="none"
      viewBox="0 0 100 14"
    >
      <path d="M0,0 L0,4 Q50,16 100,4 L100,0 Z" class="barra-topo__onda-forma" />
    </svg>

    <!--
      Fio de progresso de leitura (ordem do líder, item 4): reto na parte
      mais baixa da onda, não acompanhando a curva — testado visualmente
      contra as duas opções, uma linha reta logo abaixo do vale da onda
      leu mais sóbria e não competiu com a curva do fundo.
    -->
    <div class="barra-topo__progresso-trilho" aria-hidden="true">
      <div class="barra-topo__progresso-barra" :style="{ transform: `scaleX(${fracaoLeitura})` }" />
    </div>
  </header>
</template>

<style scoped>
.barra-topo {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 60;
  /* Mesmo par dedicado da lateral (src/ui/layout/LayoutBase.vue): fundo
     escuro fixo nos dois temas, achado do líder, 22/09/2026. Era
     --cor-primaria-escura/--cor-texto-invertido, que colapsam no mesmo
     valor no tema escuro (a mesma classe de bug, num segundo elemento). */
  background: var(--cor-sidebar-fundo, #0d2440);
  color: var(--cor-sidebar-texto, #faf9f5);
  transition:
    transform 220ms ease,
    background-color 220ms ease;
}

.barra-topo--oculta {
  transform: translateY(-100%);
}

.barra-topo--rolado {
  /* Token dedicado (tokens.css), não mais um rgba escrito aqui: no modo
     adaptado o texto do cabeçalho é preto e o fundo rolado ficava
     azul-marinho (achado do QA, 28/09/2026). Fora do modo continua o mesmo
     rgba de --cor-sidebar-fundo (#0d2440), não color-mix/rgb(from ...): ver
     o mesmo raciocínio em MenuCurriculo.vue. */
  background: var(--cor-cabecalho-rolado-fundo, rgba(13, 36, 64, 0.86));
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.barra-topo--rolado .barra-topo__onda-forma {
  fill: var(--cor-cabecalho-rolado-fundo, rgba(13, 36, 64, 0.86));
}

/* Modo adaptado: fundo opaco, sem o desfoque do que passa por trás (é
   movimento visual que o modo existe para eliminar, seção 6). */
:root[data-modo-adaptado='on'] .barra-topo--rolado {
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}

/*
  Modo adaptado em tela estreita: o cabeçalho sai do fluxo fixo e rola junto
  com a página (achado do QA, 28/09/2026: a 360px ele tinha 433px, cobria o
  título e passava de 2/3 da altura de uma janela de 640px). Com o texto
  maior do modo e a trilha sem reticências (seção 4), nenhum arranjo cabe em
  40% da tela; a pessoa alcança o botão do modo e o tema no topo de cada
  página, e o título nunca fica escondido. Acima de 880px (mesmo ponto de
  quebra da gaveta) continua fixo. --altura-cabecalho vira 0px por
  publicarAlturaReservada (script acima). A onda e o fio de progresso
  penduram fora da faixa: sem fio (não há o que acompanhar num cabeçalho que
  rola), e a onda ganha margem para não cobrir o início do conteúdo.
*/
@media (max-width: 880px) {
  :root[data-modo-adaptado='on'] .barra-topo {
    position: relative;
    margin-bottom: var(--esp-4, 1rem);
  }

  :root[data-modo-adaptado='on'] .barra-topo__progresso-trilho {
    display: none;
  }
}

.barra-topo--fixa {
  transition: none;
}

/*
  Quebra em mais de uma linha em qualquer largura e em qualquer modo
  (IMPORTANTE 2 de docs/qa-sociologia-u1.md: sem quebra, o cabeçalho tinha
  487px de conteúdo em 360px e cortava "Leitura ampliada" e "Tema"). Cada
  item tem uma largura-base própria (trilha, busca) ou o tamanho do conteúdo
  (botões): o que não cabe desce para a linha de baixo em vez de sair da
  tela. A altura da faixa, que passa a variar, é publicada pelo script
  acima (--altura-cabecalho). O min-height é um valor próprio, não
  --altura-cabecalho: essa variável agora é a MEDIDA deste elemento, e
  usá-la aqui faria a faixa nunca mais encolher.
*/
.barra-topo__linha {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  padding: var(--esp-3, 0.75rem) var(--esp-5, 1.5rem);
  min-height: 4rem;
}

@media (max-width: 640px) {
  .barra-topo__linha {
    column-gap: var(--esp-2, 0.5rem);
    padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
  }
}

.barra-topo__trilha {
  margin-right: auto;
  min-width: 0;
  flex: 1 1 8rem;
}

@media (max-width: 640px) {
  /* Base maior para a trilha: com 8rem (128px) ela dividia a primeira linha
     com o menu e a busca e o texto era cortado (COSMÉTICO 2 do QA). Com
     14rem a busca desce para a linha de baixo, junto dos botões. */
  .barra-topo__trilha {
    flex-basis: 14rem;
  }
}

.barra-topo__botao-gaveta {
  display: none;
  min-height: 44px;
  min-width: 44px;
  background: none;
  border: none;
  color: inherit;
  font-size: 1.5rem;
  cursor: pointer;
  flex-shrink: 0;
}

@media (max-width: 880px) {
  .barra-topo__botao-gaveta {
    display: block;
  }
}

.barra-topo__onda {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 14px;
  display: block;
  pointer-events: none;
}

.barra-topo__onda-forma {
  fill: var(--cor-sidebar-fundo, #0d2440);
  transition: fill 220ms ease;
}

.barra-topo__progresso-trilho {
  position: absolute;
  /* Reto na base da onda (o ponto mais baixo dela, y=16 num viewBox de
     altura 14 só porque o vale da curva ultrapassa um pouco a viewBox —
     ver o path acima), não acompanhando a curva: ver comentário no
     template. */
  top: calc(100% + 14px);
  left: 0;
  right: 0;
  height: 3px;
  pointer-events: none;
}

.barra-topo__progresso-barra {
  height: 100%;
  width: 100%;
  background: var(--cor-cabecalho-progresso, #d3b563);
  transform-origin: left;
  transform: scaleX(0);
  transition: transform 120ms linear;
}

.barra-topo--fixa .barra-topo__progresso-barra {
  transition: none;
}

@media print {
  .barra-topo {
    display: none;
  }
}
</style>
