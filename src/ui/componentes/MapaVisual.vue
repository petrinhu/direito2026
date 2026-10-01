<script setup lang="ts">
/* global SVGSVGElement, WheelEvent, Element, performance */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import type { NoMapa } from '@/core/fichamento/tipos';
import {
  abertosIniciaisVisual,
  ajustarVista,
  alternarTodosRamos,
  caminhoLigacao,
  layoutRadial,
  quebrarRotulo,
  todosAbertos
} from '@/app/fichamento';

const props = defineProps<{
  /** Árvore do mapa visual (arvoreVisual). */
  arvore: NoMapa;
  /** Endereço da unidade sem barra final. */
  baseUnidade: string;
  /** Sem animação: modo adaptado ou preferência do sistema. */
  reduzirMovimento: boolean;
}>();

const ZOOM_MINIMO = 0.1;
const ZOOM_MAXIMO = 3;
const NUMERO_DE_TONS = 6;
const LARGURA_ESTREITA = 640;

interface Vista {
  x: number;
  y: number;
  k: number;
}
interface Ponto {
  x: number;
  y: number;
}

const abertos = ref<ReadonlySet<string>>(abertosIniciaisVisual(props.arvore));
const selecionadoId = ref(props.arvore.id);
const tamanho = ref({ largura: 1000, altura: 700 });
const vista = ref<Vista>({ x: 0, y: 0, k: 1 });
const svgRef = ref<SVGSVGElement>();
const posicoes = shallowRef(new Map<string, Ponto>());

const orientacao = computed(() =>
  tamanho.value.largura < LARGURA_ESTREITA ? ('vertical' as const) : ('horizontal' as const)
);
const layout = computed(() =>
  layoutRadial(props.arvore, abertos.value, { orientacao: orientacao.value })
);

const tudoAberto = computed(() => todosAbertos(props.arvore).every((id) => abertos.value.has(id)));
const rotuloTodos = computed(() =>
  tudoAberto.value ? 'Recolher todos os ramos' : 'Abrir todos os ramos'
);

/* ---- medida do texto: largura real, não estimada por caractere ---- */
// eslint-disable-next-line no-unused-vars
let contexto: { font: string; measureText(s: string): { width: number } } | null | undefined;
function medirTexto(texto: string, tamanhoFonte: number, peso: number): number {
  if (contexto === undefined) {
    const ehJsdom = typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom');
    contexto = ehJsdom ? null : (document.createElement('canvas').getContext('2d') ?? null);
  }
  if (!contexto) return texto.length * tamanhoFonte * 0.56;
  contexto.font = `${peso} ${tamanhoFonte}px Inter, "Inter Fallback", sans-serif`;
  return contexto.measureText(texto).width;
}

/** Tamanho da cápsula por nível: o centro é maior, os períodos são hubs. */
function estiloDoNivel(profundidade: number): {
  fonte: number;
  peso: number;
  maxTexto: number;
  minAltura: number;
} {
  if (profundidade === 0) return { fonte: 18, peso: 800, maxTexto: 170, minAltura: 60 };
  if (profundidade === 1) return { fonte: 16, peso: 800, maxTexto: 150, minAltura: 44 };
  return { fonte: 14, peso: 700, maxTexto: 160, minAltura: 32 };
}

const itens = computed(() =>
  layout.value.map((p) => {
    const e = estiloDoNivel(p.profundidade);
    const texto = p.no.rotuloCurto ?? p.no.rotulo;
    const linhas = quebrarRotulo(texto, e.maxTexto, (s) => medirTexto(s, e.fonte, e.peso));
    const larguraTexto = Math.max(...linhas.map((l) => medirTexto(l, e.fonte, e.peso)));
    const alturaLinha = e.fonte * 1.25;
    return {
      ...p,
      linhas,
      fonte: e.fonte,
      alturaLinha,
      largura: Math.ceil(larguraTexto + (p.profundidade <= 1 ? 40 : 30)),
      altura: Math.max(e.minAltura, Math.ceil(linhas.length * alturaLinha + 16)),
      tom: (p.ramo % NUMERO_DE_TONS) + 1,
      aberto: abertos.value.has(p.no.id),
      expansivel: p.no.filhos.length > 0
    };
  })
);

function espessura(profundidade: number): number {
  return profundidade <= 1 ? 9 : profundidade === 2 ? 6 : profundidade === 3 ? 3.5 : 2.5;
}

const ligacoes = computed(() =>
  itens.value
    .filter((i) => i.paiId)
    .map((i) => {
      const pai = posicoes.value.get(i.paiId!) ?? { x: 0, y: 0 };
      const filho = posicoes.value.get(i.no.id) ?? { x: i.x, y: i.y };
      return {
        id: i.no.id,
        tom: i.tom,
        grossura: espessura(i.profundidade),
        d: caminhoLigacao(pai, filho)
      };
    })
);

const selecionado = computed(() => itens.value.find((i) => i.no.id === selecionadoId.value));
const detalhe = computed(() => {
  const no = selecionado.value?.no;
  if (!no) return undefined;
  if (no.detalhe) return no.detalhe;
  return no.filhos.find((f) => f.tipo === 'modo')?.detalhe;
});

const NOMES_DO_NIVEL: Record<string, string> = {
  raiz: 'Tema',
  era: 'Período',
  pensador: 'Pensador',
  modo: 'Modo de pensar',
  conceitos: 'Conceitos-chave',
  conceito: 'Conceito',
  direito: 'Para o Direito hoje',
  ressalva: 'Ressalva das fontes'
};

const transformacao = computed(
  () =>
    `translate(${tamanho.value.largura / 2 + vista.value.x} ${tamanho.value.altura / 2 + vista.value.y}) scale(${vista.value.k})`
);

/* ---- enquadramento total e animação (posições e vista juntas) ---- */
function vistaDeEnquadramento(): Vista {
  return ajustarVista(itens.value, tamanho.value.largura, tamanho.value.altura, 12);
}

let quadro = 0;
function animarPara(animar: boolean, nova: Vista): void {
  cancelAnimationFrame(quadro);
  const destino = new Map<string, Ponto>(layout.value.map((p) => [p.no.id, { x: p.x, y: p.y }]));
  if (!animar || props.reduzirMovimento || typeof requestAnimationFrame !== 'function') {
    posicoes.value = destino;
    vista.value = nova;
    return;
  }
  const atual = posicoes.value;
  const origem = new Map<string, Ponto>();
  for (const p of layout.value) {
    const proprio = atual.get(p.no.id);
    const doPai = p.paiId ? (atual.get(p.paiId) ?? destino.get(p.paiId)) : undefined;
    origem.set(p.no.id, proprio ?? doPai ?? destino.get(p.no.id)!);
  }
  const vistaOrigem = vista.value;
  const inicio = performance.now();
  const passo = (agora: number): void => {
    const t = Math.min(1, (agora - inicio) / 450);
    const e = 1 - (1 - t) ** 3;
    const proximo = new Map<string, Ponto>();
    for (const [id, fim] of destino) {
      const ini = origem.get(id)!;
      proximo.set(id, { x: ini.x + (fim.x - ini.x) * e, y: ini.y + (fim.y - ini.y) * e });
    }
    posicoes.value = proximo;
    vista.value = {
      x: vistaOrigem.x + (nova.x - vistaOrigem.x) * e,
      y: vistaOrigem.y + (nova.y - vistaOrigem.y) * e,
      k: vistaOrigem.k + (nova.k - vistaOrigem.k) * e
    };
    if (t < 1) quadro = requestAnimationFrame(passo);
  };
  quadro = requestAnimationFrame(passo);
}

function aplicarAbertos(novo: ReadonlySet<string>): void {
  abertos.value = novo;
  // Depois de abrir ou fechar, o conjunto inteiro volta a caber na janela.
  animarPara(true, vistaDeEnquadramento());
}

function alternarNo(id: string): void {
  selecionadoId.value = id;
  const no = itens.value.find((i) => i.no.id === id);
  if (!no?.expansivel) return;
  const novo = new Set(abertos.value);
  if (novo.has(id)) novo.delete(id);
  else novo.add(id);
  aplicarAbertos(novo);
}

function aoTeclar(evento: KeyboardEvent, id: string): void {
  if (evento.key !== 'Enter' && evento.key !== ' ') return;
  evento.preventDefault();
  alternarNo(id);
}

function alternarTodos(): void {
  aplicarAbertos(alternarTodosRamos(props.arvore, abertos.value));
}

/* ---- zoom e arrastar ---- */
function limitar(k: number): number {
  return Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, k));
}

function zoomPara(novoK: number, ancoraX = 0, ancoraY = 0): void {
  cancelAnimationFrame(quadro);
  const k = limitar(novoK);
  const razao = k / vista.value.k;
  vista.value = {
    k,
    x: ancoraX - (ancoraX - vista.value.x) * razao,
    y: ancoraY - (ancoraY - vista.value.y) * razao
  };
}

function aproximar(): void {
  zoomPara(vista.value.k * 1.25);
}
function afastar(): void {
  zoomPara(vista.value.k / 1.25);
}

function centralizar(): void {
  animarPara(true, vistaDeEnquadramento());
}

function aoRolar(evento: WheelEvent): void {
  const caixa = svgRef.value?.getBoundingClientRect();
  const ax = caixa ? evento.clientX - caixa.left - tamanho.value.largura / 2 : 0;
  const ay = caixa ? evento.clientY - caixa.top - tamanho.value.altura / 2 : 0;
  zoomPara(vista.value.k * (evento.deltaY < 0 ? 1.12 : 1 / 1.12), ax, ay);
}

const ponteiros = new Map<number, Ponto>();
let distanciaAnterior = 0;

function aoPressionar(evento: PointerEvent): void {
  if ((evento.target as Element).closest?.('.mapa-visual__no')) return;
  cancelAnimationFrame(quadro);
  ponteiros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
  svgRef.value?.setPointerCapture?.(evento.pointerId);
  distanciaAnterior = 0;
}

function aoMover(evento: PointerEvent): void {
  const anterior = ponteiros.get(evento.pointerId);
  if (!anterior) return;
  const atual = { x: evento.clientX, y: evento.clientY };
  ponteiros.set(evento.pointerId, atual);
  if (ponteiros.size === 1) {
    vista.value = {
      ...vista.value,
      x: vista.value.x + atual.x - anterior.x,
      y: vista.value.y + atual.y - anterior.y
    };
  } else if (ponteiros.size === 2) {
    const [a, b] = [...ponteiros.values()] as [Ponto, Ponto];
    const distancia = Math.hypot(a.x - b.x, a.y - b.y);
    if (distanciaAnterior > 0) zoomPara(vista.value.k * (distancia / distanciaAnterior));
    distanciaAnterior = distancia;
  }
}

function aoSoltar(evento: PointerEvent): void {
  ponteiros.delete(evento.pointerId);
  distanciaAnterior = 0;
}

function medir(): void {
  const caixa = svgRef.value?.getBoundingClientRect();
  if (caixa && caixa.width > 0 && caixa.height > 0) {
    tamanho.value = { largura: caixa.width, altura: caixa.height };
  }
}

/** Ao montar e ao redimensionar: mede, reposiciona e enquadra tudo, sem animação. */
function reenquadrarSemAnimar(): void {
  medir();
  animarPara(false, vistaDeEnquadramento());
}

onMounted(() => {
  reenquadrarSemAnimar();
  window.addEventListener('resize', reenquadrarSemAnimar);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(quadro);
  window.removeEventListener('resize', reenquadrarSemAnimar);
});

function posicaoDe(id: string, padrao: Ponto): Ponto {
  return posicoes.value.get(id) ?? padrao;
}

function estiloDoNo(item: { profundidade: number; tom: number }): Record<string, string> {
  if (item.profundidade === 0) {
    return {
      '--fundo': 'var(--cor-mapa-centro-fundo)',
      '--texto': 'var(--cor-mapa-centro-texto)',
      '--contorno': 'var(--cor-mapa-centro-contorno)'
    };
  }
  return {
    '--fundo': `var(--cor-mapa-ramo-${item.tom}-fundo)`,
    '--texto': `var(--cor-mapa-ramo-${item.tom}-texto)`,
    '--contorno': 'var(--cor-fundo-elevado)'
  };
}
</script>

<template>
  <div class="mapa-visual">
    <div class="mapa-visual__barra" role="group" aria-label="Controles do mapa">
      <button
        type="button"
        class="mapa-visual__botao mapa-visual__todos"
        :aria-expanded="tudoAberto ? 'true' : 'false'"
        @click="alternarTodos"
      >
        {{ rotuloTodos }}
      </button>
      <button type="button" class="mapa-visual__botao" aria-label="Aproximar" @click="aproximar">
        +
      </button>
      <button type="button" class="mapa-visual__botao" aria-label="Afastar" @click="afastar">
        −
      </button>
      <button type="button" class="mapa-visual__botao" @click="centralizar">Centralizar</button>
    </div>
    <p class="mapa-visual__ajuda">
      Toque num nó para abrir o ramo e ler o detalhe. Arraste para mover, use a roda do mouse ou os
      botões para o zoom (no celular, o gesto de pinça). A lista é a versão em texto.
    </p>
    <svg
      ref="svgRef"
      class="mapa-visual__svg"
      role="group"
      aria-label="Mapa mental visual de Filosofia Jurídica"
      @pointerdown="aoPressionar"
      @pointermove="aoMover"
      @pointerup="aoSoltar"
      @pointercancel="aoSoltar"
      @wheel.prevent="aoRolar"
    >
      <g class="mapa-visual__mundo" :transform="transformacao">
        <path
          v-for="ligacao in ligacoes"
          :key="ligacao.id"
          class="mapa-visual__ligacao"
          :d="ligacao.d"
          :style="{
            '--tom': `var(--cor-mapa-ramo-${ligacao.tom}-fundo)`,
            '--grossura': ligacao.grossura
          }"
        />
        <g
          v-for="item in itens"
          :key="item.no.id"
          class="mapa-visual__no"
          :class="{
            'mapa-visual__no--raiz': item.profundidade === 0,
            'mapa-visual__no--selecionado': item.no.id === selecionadoId
          }"
          :data-no="item.no.id"
          role="button"
          tabindex="0"
          :aria-expanded="item.expansivel ? (item.aberto ? 'true' : 'false') : undefined"
          :aria-label="`${NOMES_DO_NIVEL[item.no.tipo] ?? ''}: ${item.no.rotuloCurto ?? item.no.rotulo}`"
          :transform="`translate(${posicaoDe(item.no.id, item).x} ${posicaoDe(item.no.id, item).y})`"
          :style="estiloDoNo(item)"
          @click.stop="alternarNo(item.no.id)"
          @keydown="aoTeclar($event, item.no.id)"
        >
          <rect
            class="mapa-visual__capsula"
            :x="-item.largura / 2"
            :y="-item.altura / 2"
            :width="item.largura"
            :height="item.altura"
            :rx="Math.min(item.altura / 2, 28)"
          />
          <text
            class="mapa-visual__texto"
            text-anchor="middle"
            :style="{ fontSize: `${item.fonte}px` }"
          >
            <tspan
              v-for="(linha, indice) in item.linhas"
              :key="indice"
              x="0"
              :y="(indice - (item.linhas.length - 1) / 2) * item.alturaLinha"
              dy="0.35em"
            >
              {{ linha }}
            </tspan>
          </text>
          <circle
            v-if="item.expansivel"
            class="mapa-visual__marca"
            :cx="item.largura / 2"
            cy="0"
            r="5"
          />
        </g>
      </g>
    </svg>
    <section class="mapa-visual__detalhe" aria-live="polite" aria-label="Detalhe do nó escolhido">
      <template v-if="selecionado">
        <p class="mapa-visual__nivel">{{ NOMES_DO_NIVEL[selecionado.no.tipo] }}</p>
        <h3 class="mapa-visual__titulo">{{ selecionado.no.rotulo }}</h3>
        <p v-if="detalhe" class="mapa-visual__texto-detalhe">{{ detalhe }}</p>
        <p v-else-if="selecionado.expansivel" class="mapa-visual__texto-detalhe">
          Toque no nó para abrir ou fechar o ramo.
        </p>
        <p v-if="selecionado.no.fichaId">
          <a :href="`${baseUnidade}/fichamento#ficha-${selecionado.no.fichaId}`"
            >Ler a ficha completa</a
          >
        </p>
      </template>
    </section>
  </div>
</template>

<style scoped>
.mapa-visual__barra {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2, 0.5rem);
  margin-block: var(--esp-3, 0.75rem);
}

.mapa-visual__botao {
  min-width: max(var(--alvo-toque-minimo, 24px), 44px);
  min-height: max(var(--alvo-toque-minimo, 24px), 44px);
  padding: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  border: var(--cartao-borda, 1px solid var(--cor-borda-forte, #c3bca4));
  border-radius: 999px;
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-primaria, #163a5f);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.mapa-visual__botao:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: var(--foco-deslocamento, 2px);
}

.mapa-visual__ajuda {
  max-width: var(--largura-leitura, 68ch);
  margin-block: 0 var(--esp-3, 0.75rem);
  color: var(--cor-texto-suave, #4a4a4a);
}

.mapa-visual__svg {
  display: block;
  width: 100%;
  height: clamp(380px, 72vh, 680px);
  border: var(--cartao-borda, 1px solid var(--cor-borda, #dcd7c8));
  border-radius: var(--raio-lg, 16px);
  background: radial-gradient(
    circle at 50% 50%,
    var(--cor-fundo-elevado, #fff),
    var(--cor-fundo-sutil, #f2efe6)
  );
  touch-action: none;
  cursor: grab;
  user-select: none;
}

.mapa-visual__svg:active {
  cursor: grabbing;
}

.mapa-visual__ligacao {
  fill: none;
  stroke: var(--tom);
  stroke-width: calc(var(--grossura) * 1px);
  stroke-linecap: round;
  opacity: 0.85;
}

.mapa-visual__no {
  cursor: pointer;
  outline: none;
}

.mapa-visual__capsula {
  fill: var(--fundo);
  stroke: var(--contorno);
  stroke-width: 2;
  filter: drop-shadow(0 2px 3px rgba(13, 36, 64, 0.25));
  transition: stroke-width var(--transicao-rapida, 150ms ease);
}

.mapa-visual__texto {
  fill: var(--texto);
  font-family: var(--fonte-texto, sans-serif);
  font-weight: 700;
  pointer-events: none;
}

.mapa-visual__no--raiz .mapa-visual__capsula {
  stroke-width: 3.5;
}

.mapa-visual__marca {
  fill: var(--cor-fundo-elevado, #fff);
  stroke: var(--fundo);
  stroke-width: 2;
}

.mapa-visual__no:hover .mapa-visual__capsula {
  stroke-width: 4;
}

.mapa-visual__no--selecionado .mapa-visual__capsula {
  stroke: var(--cor-acento, #7c621c);
  stroke-width: 4;
}

.mapa-visual__no:focus-visible .mapa-visual__capsula {
  stroke: var(--cor-foco, #163a5f);
  stroke-width: 5;
  stroke-dasharray: 6 3;
}

.mapa-visual__detalhe {
  margin-top: var(--esp-3, 0.75rem);
  padding: var(--esp-3, 0.75rem) var(--esp-4, 1rem);
  border: var(--cartao-borda, 1px solid var(--cor-borda, #dcd7c8));
  border-inline-start: 6px solid var(--cor-acento, #7c621c);
  border-radius: var(--raio-md, 10px);
  background: var(--cor-fundo-elevado, #fff);
  overflow-wrap: break-word;
}

.mapa-visual__nivel {
  margin: 0;
  font-size: var(--escala-xs, 0.8125rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cor-texto-suave, #4a4a4a);
}

.mapa-visual__titulo {
  margin: var(--esp-1, 0.25rem) 0;
  font-size: var(--escala-md, 1.25rem);
  color: var(--cor-titulo-texto, #0d2440);
}

.mapa-visual__texto-detalhe {
  margin: 0 0 var(--esp-2, 0.5rem);
  max-width: var(--largura-leitura, 68ch);
}

/* Modo adaptado: preto e branco, contorno estrutural, sem sombra. */
:root[data-modo-adaptado='on'] .mapa-visual__capsula {
  stroke: #000000;
  stroke-width: 2;
  filter: none;
}

:root[data-modo-adaptado='on'] .mapa-visual__ligacao {
  stroke: #000000;
  opacity: 1;
}

@media print {
  .mapa-visual__barra,
  .mapa-visual__ajuda {
    display: none;
  }

  .mapa-visual__svg {
    height: 640px;
  }
}

:root[data-modo-adaptado='on'] .mapa-visual__botao,
:root[data-modo-adaptado='on'] .mapa-visual__titulo,
:root[data-modo-adaptado='on'] .mapa-visual__nivel,
:root[data-modo-adaptado='on'] .mapa-visual__ajuda {
  color: #000000;
}

:root[data-modo-adaptado='on'] .mapa-visual__detalhe,
:root[data-modo-adaptado='on'] .mapa-visual__no--selecionado .mapa-visual__capsula {
  border-color: #000000;
  stroke: #000000;
}

:root[data-modo-adaptado='on'] .mapa-visual__svg {
  background: #ffffff;
}
</style>
