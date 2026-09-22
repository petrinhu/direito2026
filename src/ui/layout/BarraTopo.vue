<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
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
  // para eliminar (docs/modo-adaptado.md, seção 6).
  if (!prefereMenosMovimento && !props.storeModoAdaptado.ativo.value) {
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

onMounted(() => {
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', aoRolar);
});
</script>

<template>
  <header
    class="barra-topo"
    :class="{
      'barra-topo--oculta': oculta,
      'barra-topo--rolado': rolado,
      'barra-topo--fixa': prefereMenosMovimento || props.storeModoAdaptado.ativo.value
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
      <BotaoModoAdaptado :store="storeModoAdaptado" />
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
  /* rgba fixo do mesmo hex de --cor-sidebar-fundo (#0d2440), não
     color-mix/rgb(from ...): ver o mesmo raciocínio em MenuCurriculo.vue. */
  background: rgba(13, 36, 64, 0.86);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.barra-topo--rolado .barra-topo__onda-forma {
  fill: rgba(13, 36, 64, 0.86);
}

.barra-topo--fixa {
  transition: none;
}

.barra-topo__linha {
  display: flex;
  align-items: center;
  gap: var(--esp-4, 1rem);
  padding: var(--esp-3, 0.75rem) var(--esp-5, 1.5rem);
  min-height: var(--altura-cabecalho, 64px);
}

/* Modo de leitura adaptada: a fonte maior não cabe mais numa linha só em
   tela estreita (docs/modo-adaptado.md, seção 4, "Trilha do cabeçalho...
   quebra em mais de uma linha se o texto maior não couber numa linha só,
   nunca corta com reticências"). --altura-cabecalho cresce junto (definido
   dentro do bloco do modo em tokens.css), porque LayoutBase.vue e o
   scroll-padding-top de base.css usam essa mesma variável para nunca
   deixar o conteúdo nascer escondido atrás do cabeçalho fixo. */
:root[data-modo-adaptado='on'] .barra-topo__linha {
  flex-wrap: wrap;
  row-gap: var(--esp-2, 0.5rem);
}

.barra-topo__trilha {
  margin-right: auto;
  min-width: 0;
  flex: 1;
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
