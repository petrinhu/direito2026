<script setup lang="ts">
/* global crypto */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { RouterLink } from 'vue-router';
import {
  compararRecorde,
  criarJogo,
  gravarMudo,
  gravarRecorde,
  lerMudo,
  lerRecorde,
  LICOES,
  MUNDO,
  type Cena,
  type Jogo
} from '@/app/kelsenJump';
import type { Evento } from '@/core/kelsenJump';
import { criarSons, type Sons } from './sons';
import { desenharCena, type Cores } from './desenhar';
import {
  alvoDoTeclado,
  ehTeclaDeAbaixar,
  ehTeclaDoJogo,
  jogoFicaComATecla,
  temModalAberto
} from './teclado';

const canvas = ref<HTMLCanvasElement | null>(null);
/** Recorde pessoal, lido do navegador ao montar. O placar do canvas mostra este valor. */
const recorde = ref(lerRecorde());
/** Verdadeiro só no fim da partida em que o recorde foi batido; some ao começar a próxima. */
const novoRecorde = ref(false);
const fase = ref<Cena['fase']>('aguardando');
/** Pose do Kelsen, espelhada no canvas (data-pose) para quem confere a tela sem enxergá-la. */
const pose = ref<Cena['corpo']['pose']>('parado');
const ultimaPontuacao = ref<number | undefined>(undefined);
const licao = ref<number | undefined>(undefined);
const mudo = ref(lerMudo());
/** Texto só para o leitor de tela: muda uma vez por partida, no fim (nunca a cada ponto). */
const anuncio = ref(`Recorde: ${recorde.value}.`);

const jogo = shallowRef<Jogo | null>(null);
const sons = shallowRef<Sons | null>(null);

const textoLicao = computed(() => (licao.value === undefined ? undefined : LICOES[licao.value]));
const pedidoInicial = computed(
  () => fase.value === 'aguardando' && ultimaPontuacao.value === undefined
);

/** Mesma média do CSS que mostra os botões: com ela, o aparelho é de toque. */
const MIDIA_TOQUE = '(pointer: coarse), (hover: none)';
const midiaToque = typeof window.matchMedia === 'function' ? window.matchMedia(MIDIA_TOQUE) : null;
/** Aparelho de toque: mostra os botões Pular e Abaixar e troca o texto que os cita. */
const temToque = ref(midiaToque?.matches ?? false);
/** Abaixado agora, por qualquer via (botão, seta ou perda de foco). Alimenta aria-pressed. */
const abaixado = ref(false);
/**
 * Um toque em Pular ou Abaixar já foi tratado no pointerdown. O click que o navegador manda em
 * seguida não pode repetir a ação; o click do teclado (sem toque antes) age normalmente.
 */
let pularPeloPonteiro = false;
let abaixarPeloPonteiro = false;

const textoInstrucao = computed(() => {
  if (temToque.value) {
    return pedidoInicial.value
      ? 'Toque em Pular para começar. Use os botões Pular e Abaixar. Não há pausa.'
      : 'Use os botões Pular e Abaixar. Não há pausa.';
  }
  return pedidoInicial.value
    ? 'Pressione espaço para começar. Espaço pula. Seta para baixo abaixa. Não há pausa.'
    : 'Espaço pula. Seta para baixo abaixa. Não há pausa.';
});

const ariaDoPalco = computed(() =>
  temToque.value
    ? 'Kelsen Jump. Kelsen corre e precisa pular pirâmides e passar abaixado por nuvens com a sigla NHF. Use os botões Pular e Abaixar.'
    : 'Kelsen Jump. Kelsen corre e precisa pular pirâmides e passar abaixado por nuvens com a sigla NHF. Espaço pula, seta para baixo abaixa.'
);

let coresCache: Cores = { tinta: '#1c1c1c', papel: '#faf9f5', escuro: false };
let quadrosDesdeCores = 0;
let contexto: CanvasRenderingContext2D | null = null;

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
    desenharCena(contexto, cena, coresCache, recorde.value);
  }
  if (cena.fase !== fase.value) fase.value = cena.fase;
  if (cena.corpo.pose !== pose.value) pose.value = cena.corpo.pose;
  if (cena.fase === 'correndo') novoRecorde.value = false;
  if (cena.ultimaPontuacao !== undefined && cena.ultimaPontuacao !== ultimaPontuacao.value) {
    aoTerminar(cena.ultimaPontuacao);
  }
  if (cena.ultimaPontuacao !== ultimaPontuacao.value) ultimaPontuacao.value = cena.ultimaPontuacao;
  if (cena.licao !== licao.value) licao.value = cena.licao;
}

/** Fim de partida: compara com o recorde, grava se bateu e anuncia uma vez para o leitor de tela. */
function aoTerminar(final: number): void {
  const resultado = compararRecorde(recorde.value, final);
  if (resultado.bateu) {
    gravarRecorde(resultado.recorde);
    recorde.value = resultado.recorde;
    novoRecorde.value = true;
  }
  const frase = resultado.bateu ? ' Novo recorde!' : '';
  anuncio.value = `Fim de partida. Pontuação final ${final}. Recorde: ${recorde.value}.${frase} A lição está logo abaixo do jogo.`;
}

function aoEvento(evento: Evento): void {
  sons.value?.tocar(
    evento.tipo === 'pulo' ? 'pulo' : evento.tipo === 'ponto' ? 'ponto' : 'colisao'
  );
}

function semente(): number {
  const vetor = new Uint32Array(1);
  crypto.getRandomValues(vetor);
  return vetor[0] ?? 1;
}

/**
 * Teclado no documento: vale enquanto a página do jogo estiver aberta, sem foco no canvas. O jogo
 * fica com a tecla só se o foco não estiver num campo, num botão ou num link, e não houver modal.
 */
function aoTeclaDocumento(e: KeyboardEvent): void {
  if (!ehTeclaDoJogo(e.key)) return;
  const alvo = alvoDoTeclado(document.activeElement, canvas.value);
  if (!jogoFicaComATecla(alvo, temModalAberto(document))) return;
  e.preventDefault();
  if (ehTeclaDeAbaixar(e.key)) {
    definirAbaixado(true);
    return;
  }
  if (e.repeat) return;
  pularAgora();
}

/** Abaixar vale enquanto a seta estiver pressionada: a soltura sempre conta, mesmo com foco em outro lugar. */
function aoSoltarTeclaDocumento(e: KeyboardEvent): void {
  if (ehTeclaDeAbaixar(e.key)) definirAbaixado(false);
}

/** Sem a janela em foco, o keyup pode não chegar: não deixa o Kelsen agachado. */
function aoPerderFoco(): void {
  definirAbaixado(false);
}

function definirAbaixado(ativo: boolean): void {
  abaixado.value = ativo;
  jogo.value?.agachar(ativo);
}

/** Pulo de qualquer origem (tecla ou botão): ativa o som e, na tela de espera, o pulo inicia a partida. */
function pularAgora(): void {
  sons.value?.ativar();
  jogo.value?.pular();
}

/** O pulo sai no pointerdown, sem esperar o click, para não ter atraso no toque. */
function aoPressionarPular(e: PointerEvent): void {
  e.preventDefault();
  pularPeloPonteiro = true;
  pularAgora();
}

function aoClicarPular(): void {
  if (pularPeloPonteiro) {
    pularPeloPonteiro = false;
    return;
  }
  pularAgora();
}

function aoCancelarPular(): void {
  pularPeloPonteiro = false;
}

/** Abaixar segura: agacha enquanto o dedo estiver pressionado. Captura o ponteiro para a soltura chegar aqui. */
function aoPressionarAbaixar(e: PointerEvent): void {
  e.preventDefault();
  abaixarPeloPonteiro = true;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  sons.value?.ativar();
  // Na tela de espera, só um pulo inicia a partida (o núcleo não tem outro começo): como o espaço.
  if (fase.value === 'aguardando') jogo.value?.pular();
  definirAbaixado(true);
}

function aoSoltarAbaixar(): void {
  definirAbaixado(false);
}

function aoCancelarAbaixar(): void {
  abaixarPeloPonteiro = false;
  definirAbaixado(false);
}

/** Click sem toque antes (teclado ou leitor de tela) alterna, como um botão de estado. */
function aoClicarAbaixar(): void {
  if (abaixarPeloPonteiro) {
    abaixarPeloPonteiro = false;
    return;
  }
  definirAbaixado(!abaixado.value);
}

function aoMudarToque(e: { readonly matches: boolean }): void {
  temToque.value = e.matches;
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
  document.addEventListener('keydown', aoTeclaDocumento);
  document.addEventListener('keyup', aoSoltarTeclaDocumento);
  window.addEventListener('blur', aoPerderFoco);
  midiaToque?.addEventListener('change', aoMudarToque);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', aoTeclaDocumento);
  document.removeEventListener('keyup', aoSoltarTeclaDocumento);
  window.removeEventListener('blur', aoPerderFoco);
  midiaToque?.removeEventListener('change', aoMudarToque);
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
      :data-pose="pose"
      :aria-label="ariaDoPalco"
    ></canvas>

    <div class="kj__controles" role="group" aria-label="Controles do jogo">
      <button
        type="button"
        class="kj__botao kj__botao--pular"
        @pointerdown="aoPressionarPular"
        @pointercancel="aoCancelarPular"
        @click="aoClicarPular"
        @contextmenu.prevent
      >
        Pular
      </button>
      <button
        type="button"
        class="kj__botao kj__botao--abaixar"
        :aria-pressed="abaixado ? 'true' : 'false'"
        @pointerdown="aoPressionarAbaixar"
        @pointerup="aoSoltarAbaixar"
        @pointerleave="aoSoltarAbaixar"
        @pointercancel="aoCancelarAbaixar"
        @lostpointercapture="aoSoltarAbaixar"
        @click="aoClicarAbaixar"
        @contextmenu.prevent
      >
        Abaixar
      </button>
    </div>

    <p class="kj__instrucao">{{ textoInstrucao }}</p>

    <p class="kj__instrucao kj__legenda">NHF - Norma Hipotética Fundamental</p>

    <div class="kj__barra">
      <button
        type="button"
        class="kj__mudo"
        :class="{ 'kj__mudo--mudo': mudo }"
        :aria-label="mudo ? 'Ligar o som' : 'Desligar o som'"
        @click="alternarMudo"
      >
        <svg
          class="kj__mudo-icone"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor" />
          <template v-if="!mudo">
            <path d="M16 9a4 4 0 0 1 0 6" />
            <path d="M18.5 6.5a8 8 0 0 1 0 11" />
          </template>
          <template v-else>
            <circle cx="18" cy="18" r="4.5" />
            <line x1="14.8" y1="14.8" x2="21.2" y2="21.2" />
          </template>
        </svg>
      </button>
    </div>

    <p class="kj__so-leitor" aria-live="polite" data-recorde-leitor>{{ anuncio }}</p>

    <p v-if="novoRecorde && fase === 'aguardando'" class="kj__novo-recorde">Novo recorde!</p>

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
/* Os botões são só para toque; no desktop com mouse, o teclado continua sendo o controle. */
.kj__controles {
  display: none;
  grid-template-columns: 1fr 1fr;
  gap: var(--esp-3, 0.75rem);
}
@media (pointer: coarse), (hover: none) {
  .kj__controles {
    display: grid;
  }
}
.kj__botao {
  min-height: 3.5rem;
  padding: 0.5rem;
  font: inherit;
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--cor-texto);
  background: var(--cor-fundo);
  border: 2px solid var(--cor-texto);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.kj__botao[aria-pressed='true'] {
  background: var(--cor-texto);
  color: var(--cor-fundo);
}
.kj__botao:focus-visible {
  outline: 3px solid var(--cor-texto);
  outline-offset: 3px;
}
.kj__barra {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--esp-3, 0.75rem);
  flex-wrap: wrap;
}
.kj__novo-recorde {
  margin: 0;
  font-weight: bold;
}
.kj__mudo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0.25rem;
  color: var(--cor-texto);
  background: var(--cor-fundo);
  border: 2px solid var(--cor-texto);
  cursor: pointer;
}
.kj__mudo-icone {
  width: 1.75rem;
  height: 1.75rem;
  overflow: visible;
}
.kj__mudo--mudo {
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
