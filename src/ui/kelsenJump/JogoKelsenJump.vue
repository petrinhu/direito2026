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

const canvas = ref<HTMLCanvasElement | null>(null);
/** Recorde pessoal, lido do navegador ao montar. O placar do canvas mostra este valor. */
const recorde = ref(lerRecorde());
/** Verdadeiro só no fim da partida em que o recorde foi batido; some ao começar a próxima. */
const novoRecorde = ref(false);
const fase = ref<Cena['fase']>('aguardando');
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
