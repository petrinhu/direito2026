<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { EquipeRestrita, Slide } from '@/core/restrito/tipos';
import SlideConteudo from './SlideConteudo.vue';

const props = defineProps<{
  slides: readonly Slide[];
  /** A capa mostra a equipe; o slide em si não repete nomes. */
  equipe: EquipeRestrita;
  /** Sem transição nem brilho animado: preferência do sistema (prefers-reduced-motion). */
  reduzirMovimento: boolean;
}>();

/** Tempo da apresentação, em segundos (10 minutos). */
const DURACAO_CRONOMETRO = 600;
/** Arrastar mínimo, em pixels, para contar como troca de slide por toque. */
const DISTANCIA_MINIMA_TOQUE = 60;
const CLASSE_IMPRIMINDO = 'ar-imprimindo';

const indice = ref(0);
const mostrarNotas = ref(false);
const telaCheia = ref(false);
const anuncio = ref('');
const deck = ref<HTMLElement>();

const total = computed(() => props.slides.length);
const slide = computed(() => props.slides[indice.value]!);
const rotuloDoSlide = (i: number): string => `Slide ${i + 1} de ${total.value}`;

function irPara(destino: number): void {
  const novo = Math.min(Math.max(destino, 0), total.value - 1);
  if (novo === indice.value) return;
  indice.value = novo;
  anuncio.value = `${rotuloDoSlide(novo)}: ${slide.value.titulo}`;
}

const proximo = (): void => irPara(indice.value + 1);
const anterior = (): void => irPara(indice.value - 1);

// Tela cheia: API nativa quando existe e deixa; senão, o mesmo efeito por CSS.
async function alternarTelaCheia(): Promise<void> {
  if (document.fullscreenEnabled === true && deck.value) {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await deck.value.requestFullscreen();
      return;
    } catch {
      // Sem permissão da API: cai no modo de tela cheia por CSS abaixo.
    }
  }
  telaCheia.value = !telaCheia.value;
}

function aoMudarTelaCheia(): void {
  telaCheia.value = document.fullscreenElement === deck.value;
}

const alternarNotas = (): void => {
  mostrarNotas.value = !mostrarNotas.value;
};

function aoTeclar(evento: KeyboardEvent): void {
  if (evento.ctrlKey || evento.altKey || evento.metaKey) return;
  // Esc sai da tela cheia por CSS (a nativa o navegador já trata): nunca uma armadilha de teclado.
  if (evento.key === 'Escape' && telaCheia.value && !document.fullscreenElement) {
    telaCheia.value = false;
    return;
  }
  const acoes: Record<string, () => void> = {
    ArrowRight: proximo,
    PageDown: proximo,
    ' ': proximo,
    ArrowLeft: anterior,
    PageUp: anterior,
    Home: () => irPara(0),
    End: () => irPara(total.value - 1),
    n: alternarNotas,
    N: alternarNotas,
    f: () => void alternarTelaCheia(),
    F: () => void alternarTelaCheia()
  };
  const acao = acoes[evento.key];
  if (!acao) return;
  evento.preventDefault();
  acao();
}

let inicioToque: number | undefined;
function aoPressionar(evento: PointerEvent): void {
  if (evento.pointerType === 'touch') inicioToque = evento.clientX;
}
function aoSoltar(evento: PointerEvent): void {
  if (inicioToque === undefined) return;
  const delta = evento.clientX - inicioToque;
  inicioToque = undefined;
  if (Math.abs(delta) < DISTANCIA_MINIMA_TOQUE) return;
  if (delta < 0) proximo();
  else anterior();
}
const aoCancelarToque = (): void => {
  inicioToque = undefined;
};

// Cronômetro: opcional, sem som, calculado pelo relógio (não acumula atraso do intervalo).
const restante = ref(DURACAO_CRONOMETRO);
const cronometroVisivel = ref(false);
const cronometroAtivo = ref(false);
let relogio: ReturnType<typeof setInterval> | undefined;
let fimPrevisto = 0;

const tempoFormatado = computed(() => {
  const minutos = Math.floor(restante.value / 60);
  const segundos = restante.value % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
});

function pararRelogio(): void {
  if (relogio !== undefined) clearInterval(relogio);
  relogio = undefined;
  cronometroAtivo.value = false;
}

function aoTique(): void {
  restante.value = Math.max(0, Math.ceil((fimPrevisto - Date.now()) / 1000));
  if (restante.value > 0) return;
  pararRelogio();
  anuncio.value = 'Tempo de 10 minutos esgotado.';
}

function alternarCronometro(): void {
  if (cronometroAtivo.value) {
    pararRelogio();
    return;
  }
  if (restante.value === 0) restante.value = DURACAO_CRONOMETRO;
  cronometroVisivel.value = true;
  cronometroAtivo.value = true;
  fimPrevisto = Date.now() + restante.value * 1000;
  relogio = setInterval(aoTique, 1000);
}

function zerarCronometro(): void {
  pararRelogio();
  restante.value = DURACAO_CRONOMETRO;
  cronometroVisivel.value = false;
}

// Impressão: uma página 16:9 por slide, com as notas abaixo se pedido. As páginas
// só existem no DOM durante a impressão e saem do <body> para o CSS esconder o resto do site.
const imprimindo = ref<'nenhuma' | 'com-notas' | 'sem-notas'>('nenhuma');

async function imprimir(comNotas: boolean): Promise<void> {
  imprimindo.value = comNotas ? 'com-notas' : 'sem-notas';
  document.documentElement.classList.add(CLASSE_IMPRIMINDO);
  await nextTick();
  window.print();
}

function aoTerminarImpressao(): void {
  imprimindo.value = 'nenhuma';
  document.documentElement.classList.remove(CLASSE_IMPRIMINDO);
}

onMounted(() => {
  document.addEventListener('fullscreenchange', aoMudarTelaCheia);
  window.addEventListener('afterprint', aoTerminarImpressao);
});
onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', aoMudarTelaCheia);
  window.removeEventListener('afterprint', aoTerminarImpressao);
  pararRelogio();
  document.documentElement.classList.remove(CLASSE_IMPRIMINDO);
});
</script>

<template>
  <section class="ar-slides" aria-labelledby="ar-slides-titulo">
    <h2 id="ar-slides-titulo">Slides da apresentação</h2>
    <p class="ar-slides__ajuda">
      Setas, espaço, PageDown e PageUp trocam de slide; Home e End vão às pontas; N mostra as notas;
      F abre em tela cheia e Esc sai. No celular, deslize para o lado. Sem som.
    </p>

    <div
      ref="deck"
      class="ar-slides__deck"
      :class="{
        'ar-slides__deck--cheia': telaCheia,
        'ar-slides__deck--sem-movimento': reduzirMovimento
      }"
    >
      <div
        class="ar-slides__palco"
        tabindex="0"
        role="group"
        aria-roledescription="apresentação de slides"
        aria-label="Slides. Use as setas do teclado para trocar de slide."
        @keydown="aoTeclar"
        @pointerdown="aoPressionar"
        @pointerup="aoSoltar"
        @pointercancel="aoCancelarToque"
      >
        <Transition name="ar-slide" mode="out-in" :css="!reduzirMovimento">
          <SlideConteudo
            :key="slide.id"
            :slide="slide"
            :equipe="equipe"
            :rotulo="rotuloDoSlide(indice)"
          />
        </Transition>
      </div>

      <div class="ar-slides__barra">
        <div class="ar-slides__progresso" aria-hidden="true">
          <span :style="{ width: `${((indice + 1) / total) * 100}%` }" />
        </div>
        <div class="ar-slides__controles">
          <button
            type="button"
            class="ar-botao"
            data-acao="anterior"
            :aria-disabled="indice === 0 ? 'true' : undefined"
            @click="anterior"
          >
            Anterior
          </button>
          <p class="ar-slides__contador">{{ indice + 1 }} / {{ total }}</p>
          <button
            type="button"
            class="ar-botao"
            data-acao="proximo"
            :aria-disabled="indice === total - 1 ? 'true' : undefined"
            @click="proximo"
          >
            Próximo
          </button>
          <button
            type="button"
            class="ar-botao"
            data-acao="notas"
            :aria-pressed="mostrarNotas ? 'true' : 'false'"
            @click="alternarNotas"
          >
            Notas do apresentador
          </button>
          <button
            type="button"
            class="ar-botao"
            data-acao="tela-cheia"
            :aria-pressed="telaCheia ? 'true' : 'false'"
            @click="alternarTelaCheia"
          >
            Tela cheia
          </button>
          <button
            type="button"
            class="ar-botao"
            data-acao="cronometro"
            :aria-pressed="cronometroAtivo ? 'true' : 'false'"
            @click="alternarCronometro"
          >
            Cronômetro de 10 min
          </button>
          <template v-if="cronometroVisivel">
            <p
              class="ar-slides__tempo"
              :class="{ 'ar-slides__tempo--fim': restante === 0 }"
              role="timer"
              aria-label="Tempo restante"
            >
              {{ tempoFormatado }}
            </p>
            <button
              type="button"
              class="ar-botao"
              data-acao="cronometro-zerar"
              @click="zerarCronometro"
            >
              Zerar cronômetro
            </button>
          </template>
          <button
            type="button"
            class="ar-botao"
            data-acao="imprimir-com-notas"
            @click="imprimir(true)"
          >
            Imprimir com notas
          </button>
          <button type="button" class="ar-botao" data-acao="imprimir" @click="imprimir(false)">
            Imprimir sem notas
          </button>
        </div>
      </div>

      <aside v-if="mostrarNotas" class="ar-slides__notas" aria-label="Notas do apresentador">
        <h3>Notas do slide {{ indice + 1 }}</h3>
        <p>{{ slide.notas }}</p>
      </aside>
    </div>

    <p class="ar-visualmente-oculto" role="status" aria-live="polite">{{ anuncio }}</p>

    <Teleport v-if="imprimindo !== 'nenhuma'" to="body">
      <div class="ar-impresso" aria-hidden="true">
        <section v-for="(item, i) in slides" :key="item.id" class="ar-impresso__pagina">
          <div class="ar-impresso__quadro">
            <SlideConteudo :slide="item" :equipe="equipe" :rotulo="rotuloDoSlide(i)" />
          </div>
          <div v-if="imprimindo === 'com-notas'" class="ar-impresso__notas">
            <h3>Notas do slide {{ i + 1 }}</h3>
            <p>{{ item.notas }}</p>
          </div>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.ar-slides__ajuda {
  max-width: var(--largura-leitura, 68ch);
  color: var(--cor-texto-suave);
}

.ar-slides__deck {
  --ar-slide-fundo: #0d1118;
  display: grid;
  gap: var(--esp-3, 0.75rem);
  padding: var(--esp-3, 0.75rem);
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-lg, 16px);
  background: var(--cor-fundo-elevado);
}

.ar-slides__deck--cheia {
  position: fixed;
  inset: 0;
  z-index: 200;
  align-content: center;
  border-radius: 0;
  overflow: auto;
}

.ar-slides__deck:fullscreen {
  align-content: center;
  border-radius: 0;
  overflow: auto;
}

.ar-slides__palco {
  container-type: inline-size;
  touch-action: pan-y;
  border-radius: var(--raio-md, 10px);
  outline: none;
}

.ar-slides__palco:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco);
  outline-offset: 3px;
}

.ar-slides__barra {
  display: grid;
  gap: 0.5rem;
}

.ar-slides__progresso {
  height: 4px;
  border-radius: 2px;
  background: var(--cor-borda);
  overflow: hidden;
}

.ar-slides__progresso span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #3dd5f3, #d9b280);
  transition: width 240ms ease;
}

.ar-slides__controles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2, 0.5rem);
  align-items: center;
}

.ar-slides__contador {
  margin: 0;
  min-width: 4.5rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.ar-slides__notas {
  padding: var(--esp-4, 1rem);
  border: 1px dashed var(--cor-borda-forte);
  border-radius: var(--raio-md, 10px);
  background: var(--cor-fundo-sutil);
}

.ar-slides__notas h3 {
  margin-top: 0;
}

.ar-slides__notas p {
  max-width: 70ch;
  margin-bottom: 0;
  font-size: 1.05rem;
  line-height: 1.7;
}

/* Troca de slide: esmaecer e deslizar de leve. */
.ar-slide-enter-active,
.ar-slide-leave-active {
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}
.ar-slide-enter-from {
  opacity: 0;
  transform: translateX(2.5%);
}
.ar-slide-leave-to {
  opacity: 0;
  transform: translateX(-2.5%);
}

@media (prefers-reduced-motion: reduce) {
  .ar-slides__progresso span {
    transition: none;
  }
}

.ar-slides__deck--sem-movimento .ar-slides__progresso span {
  transition: none;
}

.ar-slides__tempo {
  margin: 0;
  min-width: 4.5rem;
  text-align: center;
  font-family: var(--fonte-mono, monospace);
  font-size: 1.25rem;
  font-variant-numeric: tabular-nums;
  color: var(--ar-ciano, var(--cor-texto));
}

.ar-slides__tempo--fim {
  color: var(--ar-coral, var(--cor-erro-texto));
}

/* Páginas de impressão: só existem durante a impressão (v-if) e ficam fora da tela. */
.ar-impresso {
  display: none;
}

@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }

  .ar-slides__barra,
  .ar-slides__ajuda {
    display: none;
  }

  .ar-impresso {
    display: block;
  }

  .ar-impresso__pagina {
    break-after: page;
    break-inside: avoid;
    padding: 0;
  }

  .ar-impresso__pagina:last-child {
    break-after: auto;
  }

  /* Fora da área restrita as variáveis da identidade não existem: repõe as que o slide usa. */
  .ar-impresso__quadro {
    --cor-texto: #e8dcc6;
    --cor-texto-suave: #bfb29a;
    --ar-ouro-claro: #d9b280;
    --ar-ciano: #3dd5f3;
    container-type: inline-size;
    width: 200mm;
    margin-inline: auto;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .ar-impresso__notas {
    width: 200mm;
    margin: 4mm auto 0;
    color: #111111;
    font-size: 10pt;
    line-height: 1.45;
  }

  .ar-impresso__notas h3 {
    margin: 0 0 1mm;
    font-size: 10pt;
  }

  .ar-impresso__notas p {
    margin: 0;
  }
}
</style>
