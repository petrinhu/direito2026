<script setup lang="ts">
/* global crypto */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { RouterLink } from 'vue-router';
import {
  criarJogo,
  gravarMudo,
  lerMudo,
  LICOES,
  MUNDO,
  type Cena,
  type Jogo
} from '@/app/kelsenJump';
import type { Evento } from '@/core/kelsenJump';
import { criarSons, type Sons } from './sons';
import { desenharCena, type Cores } from './desenhar';

/** Marco de pontos em que o leitor de tela é avisado, para não narrar a cada quadro. */
const MARCO_ANUNCIO = 100;

const canvas = ref<HTMLCanvasElement | null>(null);
const pontuacao = ref(0);
const fase = ref<Cena['fase']>('aguardando');
const ultimaPontuacao = ref<number | undefined>(undefined);
const licao = ref<number | undefined>(undefined);
const mudo = ref(lerMudo());
const anuncio = ref('');

const jogo = shallowRef<Jogo | null>(null);
const sons = shallowRef<Sons | null>(null);

const textoLicao = computed(() => (licao.value === undefined ? undefined : LICOES[licao.value]));
const pedidoInicial = computed(
  () => fase.value === 'aguardando' && ultimaPontuacao.value === undefined
);

let coresCache: Cores = { tinta: '#1c1c1c', papel: '#faf9f5', escuro: false };
let quadrosDesdeCores = 0;
let contexto: CanvasRenderingContext2D | null = null;
let ultimoMarco = 0;

function lerCores(): Cores {
  const cs = getComputedStyle(document.documentElement);
  return {
    tinta: cs.getPropertyValue('--cor-texto').trim() || '#1c1c1c',
    papel: cs.getPropertyValue('--cor-fundo').trim() || '#faf9f5',
    // KELSEN-JUMP: o tema vem do atributo que o store de tema grava na raiz (data-theme="dark").
    escuro: document.documentElement.getAttribute('data-theme') === 'dark'
  };
}

function ajustarResolucao(el: HTMLCanvasElement): void {
  const escala = Math.min(window.devicePixelRatio || 1, 2);
  el.width = MUNDO.largura * escala;
  el.height = MUNDO.altura * escala;
  contexto?.setTransform(escala, 0, 0, escala, 0, 0);
}

function aoAtualizar(cena: Cena): void {
  if (contexto && canvas.value) {
    if (quadrosDesdeCores % 30 === 0) coresCache = lerCores();
    quadrosDesdeCores++;
    desenharCena(contexto, cena, coresCache);
  }
  if (cena.pontuacao !== pontuacao.value) pontuacao.value = cena.pontuacao;
  if (cena.fase !== fase.value) fase.value = cena.fase;
  if (cena.ultimaPontuacao !== ultimaPontuacao.value) ultimaPontuacao.value = cena.ultimaPontuacao;
  if (cena.licao !== licao.value) licao.value = cena.licao;
  const marco = Math.floor(cena.pontuacao / MARCO_ANUNCIO) * MARCO_ANUNCIO;
  if (marco > ultimoMarco) {
    ultimoMarco = marco;
    anuncio.value = `Pontuação ${cena.pontuacao}.`;
  }
}

function aoEvento(evento: Evento): void {
  sons.value?.tocar(
    evento.tipo === 'pulo' ? 'pulo' : evento.tipo === 'ponto' ? 'ponto' : 'colisao'
  );
  if (evento.tipo === 'colisao') {
    ultimoMarco = 0;
    anuncio.value = `Fim de partida. A pontuação foi ${pontuacao.value}. A lição está logo abaixo do jogo.`;
  }
}

function semente(): number {
  const vetor = new Uint32Array(1);
  crypto.getRandomValues(vetor);
  return vetor[0] ?? 1;
}

/** Espaço e toque pulam. Só o canvas recebe a tecla, então botões da página continuam com Espaço. */
function aoTecla(e: KeyboardEvent): void {
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    if (!e.repeat) {
      sons.value?.ativar();
      jogo.value?.pular();
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    jogo.value?.agachar(true);
  }
}

function aoSoltarTecla(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') jogo.value?.agachar(false);
}

function aoToque(e: PointerEvent): void {
  e.preventDefault();
  sons.value?.ativar();
  jogo.value?.pular();
}

function alternarMudo(): void {
  mudo.value = !mudo.value;
  sons.value?.definirMudo(mudo.value);
  gravarMudo(mudo.value);
}

onMounted(() => {
  const el = canvas.value;
  if (!el) return;
  contexto = el.getContext('2d');
  ajustarResolucao(el);
  coresCache = lerCores();
  sons.value = criarSons(mudo.value);
  jogo.value = criarJogo({
    semente: semente(),
    totalLicoes: LICOES.length,
    aoAtualizar,
    aoEvento
  });
  jogo.value.iniciar();
  el.addEventListener('keydown', aoTecla);
  el.addEventListener('keyup', aoSoltarTecla);
  el.addEventListener('pointerdown', aoToque);
});

onBeforeUnmount(() => {
  const el = canvas.value;
  el?.removeEventListener('keydown', aoTecla);
  el?.removeEventListener('keyup', aoSoltarTecla);
  el?.removeEventListener('pointerdown', aoToque);
  jogo.value?.parar();
  sons.value?.fechar();
  jogo.value = null;
  sons.value = null;
});
</script>

<template>
  <section class="kj" aria-labelledby="kj-titulo">
    <h2 id="kj-titulo" class="kj__titulo">Jogo</h2>
    <canvas
      ref="canvas"
      class="kj__tela"
      role="img"
      tabindex="0"
      aria-label="Kelsen Jump. Kelsen corre e precisa pular pirâmides e passar abaixado por nuvens com a sigla NHF. Espaço pula, seta para baixo abaixa."
    ></canvas>

    <p class="kj__instrucao">
      <template v-if="pedidoInicial">
        Pressione espaço para começar. Espaço pula. Seta para baixo abaixa. Não há pausa.
      </template>
      <template v-else>Espaço pula. Seta para baixo abaixa. Não há pausa.</template>
    </p>

    <p class="kj__instrucao kj__legenda">NHF - Norma Hipotética Fundamental</p>

    <div class="kj__barra">
      <p class="kj__placar">
        Pontuação: <span data-pontuacao>{{ pontuacao }}</span>
      </p>
      <button
        type="button"
        class="kj__mudo"
        :aria-pressed="mudo ? 'true' : 'false'"
        @click="alternarMudo"
      >
        Mudo
      </button>
    </div>

    <p class="kj__so-leitor" aria-live="polite">{{ anuncio }}</p>

    <section
      v-if="textoLicao && fase === 'aguardando'"
      class="kj__licao"
      aria-labelledby="kj-licao-titulo"
      data-licao
    >
      <h3 id="kj-licao-titulo" class="kj__licao-titulo">Lição da partida</h3>
      <p class="kj__licao-texto">{{ textoLicao.texto }}</p>
      <p class="kj__licao-origem">
        Unidade:
        <RouterLink :to="textoLicao.caminho">{{ textoLicao.unidade }}</RouterLink>
      </p>
    </section>
  </section>
</template>

<style scoped>
.kj {
  position: relative;
  display: grid;
  gap: var(--esp-3, 0.75rem);
  max-width: 60rem;
}
.kj__titulo {
  font-size: 1.1rem;
  margin: 0;
}
.kj__tela {
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 1;
  background: var(--cor-fundo);
  color: var(--cor-texto);
  border: 2px solid var(--cor-texto);
  touch-action: manipulation;
}
.kj__tela:focus-visible {
  outline: 3px solid var(--cor-texto);
  outline-offset: 4px;
}
.kj__instrucao {
  margin: 0;
}
.kj__barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--esp-3, 0.75rem);
  flex-wrap: wrap;
}
.kj__placar {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.kj__mudo {
  font: inherit;
  color: var(--cor-texto);
  background: var(--cor-fundo);
  border: 2px solid var(--cor-texto);
  padding: 0.25rem 0.75rem;
  cursor: pointer;
}
.kj__mudo[aria-pressed='true'] {
  background: var(--cor-texto);
  color: var(--cor-fundo);
}
.kj__mudo:focus-visible {
  outline: 3px solid var(--cor-texto);
  outline-offset: 3px;
}
.kj__licao {
  border-left: 4px solid var(--cor-texto);
  padding-left: var(--esp-3, 0.75rem);
}
.kj__licao-titulo {
  font-size: 1rem;
  margin: 0 0 0.25rem;
}
.kj__licao-texto,
.kj__licao-origem {
  margin: 0.25rem 0;
}
.kj__so-leitor {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
