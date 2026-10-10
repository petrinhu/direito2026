<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onErrorCaptured, onMounted, ref, watch } from 'vue';
import { calcularEscala, milimetrosParaPixels } from '@/app/restrito/palco';
import type { EquipeRestrita, Slide } from '@/core/restrito/tipos';
import PalcoSlide from './PalcoSlide.vue';
import SlideConteudo from './SlideConteudo.vue';
import SlideSimples from './SlideSimples.vue';

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
const CLASSE_IMPRIMINDO_SEM_NOTAS = 'ar-imprimindo--sem-notas';
/** Área útil da A4 paisagem (297 x 210 mm com margem de 10 mm), com folga de 7 mm. */
const IMPRESSAO_LARGURA_MM = 270;
/** Altura que o quadro pode ocupar na página: com notas sobra espaço para o texto delas. */
const IMPRESSAO_ALTURA_COM_NOTAS_MM = 120;
/** Sem notas: página 16:9 inteira (13,333 x 7,5 in), sem margem; o quadro ocupa tudo. */
const IMPRESSAO_LARGURA_SEM_NOTAS_MM = 338.67;
const IMPRESSAO_ALTURA_SEM_NOTAS_MM = 190.5;

const indice = ref(0);
const mostrarNotas = ref(false);
const telaCheia = ref(false);
const anuncio = ref('');
const deck = ref<HTMLElement>();
const palco = ref<HTMLElement>();
const area = ref<HTMLElement>();
const escala = ref(1);

/** Mede o espaço disponível do palco (janela, tela cheia, celular) e recalcula a escala. */
function medirArea(): void {
  const el = area.value;
  if (el) escala.value = calcularEscala(el.clientWidth, el.clientHeight);
}

const total = computed(() => props.slides.length);
const slide = computed(() => props.slides[indice.value]!);
const rotuloDoSlide = (i: number): string => `Slide ${i + 1} de ${total.value}`;

/**
 * Id do slide cuja renderização falhou. Um erro num slide nunca deixa a tela vazia:
 * esse slide cai para a versão simples (título e itens) e os demais seguem normais.
 */
const slideComFalha = ref<number | undefined>(undefined);
onErrorCaptured(() => {
  slideComFalha.value = slide.value.id;
  return false;
});
watch(
  () => slide.value.id,
  () => {
    slideComFalha.value = undefined;
  }
);

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
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await deck.value.requestFullscreen();
        palco.value?.focus();
      }
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

watch(telaCheia, () => void nextTick(medirArea));

const alternarNotas = (): void => {
  mostrarNotas.value = !mostrarNotas.value;
};

// Teclado global (document): as setas valem em qualquer foco da página, mas nunca
// roubam a digitação de campos nem a ativação nativa de botões e links.
const SELETOR_CAMPO_DE_TEXTO =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const SELETOR_BOTAO_OU_LINK = 'button, a[href]';

function alvoEhCampoDeTexto(alvo: EventTarget | null): boolean {
  return alvo instanceof window.Element && alvo.closest(SELETOR_CAMPO_DE_TEXTO) !== null;
}

function alvoEhBotaoOuLink(alvo: EventTarget | null): boolean {
  return alvo instanceof window.Element && alvo.closest(SELETOR_BOTAO_OU_LINK) !== null;
}

function aoTeclar(evento: KeyboardEvent): void {
  if (evento.defaultPrevented) return;
  if (alvoEhCampoDeTexto(evento.target)) return;
  if (evento.key === ' ' && alvoEhBotaoOuLink(evento.target)) return;
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

const escalaImpressao = computed(() =>
  imprimindo.value === 'sem-notas'
    ? calcularEscala(
        milimetrosParaPixels(IMPRESSAO_LARGURA_SEM_NOTAS_MM),
        milimetrosParaPixels(IMPRESSAO_ALTURA_SEM_NOTAS_MM)
      )
    : calcularEscala(
        milimetrosParaPixels(IMPRESSAO_LARGURA_MM),
        milimetrosParaPixels(IMPRESSAO_ALTURA_COM_NOTAS_MM)
      )
);

async function imprimir(comNotas: boolean): Promise<void> {
  imprimindo.value = comNotas ? 'com-notas' : 'sem-notas';
  document.documentElement.classList.add(CLASSE_IMPRIMINDO);
  if (!comNotas) document.documentElement.classList.add(CLASSE_IMPRIMINDO_SEM_NOTAS);
  await nextTick();
  window.print();
}

function aoTerminarImpressao(): void {
  imprimindo.value = 'nenhuma';
  document.documentElement.classList.remove(CLASSE_IMPRIMINDO, CLASSE_IMPRIMINDO_SEM_NOTAS);
}

let observador: InstanceType<typeof window.ResizeObserver> | undefined;

onMounted(() => {
  document.addEventListener('fullscreenchange', aoMudarTelaCheia);
  document.addEventListener('keydown', aoTeclar);
  window.addEventListener('afterprint', aoTerminarImpressao);
  medirArea();
  if (typeof window.ResizeObserver === 'function' && area.value) {
    observador = new window.ResizeObserver(medirArea);
    observador.observe(area.value);
  } else {
    window.addEventListener('resize', medirArea);
  }
});
onBeforeUnmount(() => {
  observador?.disconnect();
  window.removeEventListener('resize', medirArea);
  document.removeEventListener('fullscreenchange', aoMudarTelaCheia);
  document.removeEventListener('keydown', aoTeclar);
  window.removeEventListener('afterprint', aoTerminarImpressao);
  pararRelogio();
  document.documentElement.classList.remove(CLASSE_IMPRIMINDO, CLASSE_IMPRIMINDO_SEM_NOTAS);
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
        ref="palco"
        class="ar-slides__palco"
        tabindex="0"
        role="group"
        aria-roledescription="apresentação de slides"
        aria-label="Slides. Use as setas do teclado para trocar de slide."
        @pointerdown="aoPressionar"
        @pointerup="aoSoltar"
        @pointercancel="aoCancelarToque"
      >
        <p class="ar-slides__gire" role="status">
          <svg
            class="ar-slides__gire-icone"
            viewBox="0 0 48 48"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="15" y="4" width="18" height="30" rx="3" />
            <path d="M8 40h32m0 0-5-5m5 5-5 5" />
          </svg>
          Gire o aparelho para ver os slides
        </p>
        <div ref="area" class="ar-slides__area">
          <PalcoSlide :escala="escala">
            <Transition name="ar-slide" mode="out-in" :css="!reduzirMovimento">
              <SlideSimples
                v-if="slideComFalha === slide.id"
                :key="`simples-${slide.id}`"
                :slide="slide"
              />
              <SlideConteudo
                v-else
                :key="slide.id"
                :slide="slide"
                :equipe="equipe"
                :rotulo="rotuloDoSlide(indice)"
              />
            </Transition>
          </PalcoSlide>
        </div>
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
      <div
        class="ar-impresso"
        :class="{ 'ar-impresso--sem-notas': imprimindo === 'sem-notas' }"
        aria-hidden="true"
      >
        <section v-for="(item, i) in slides" :key="item.id" class="ar-impresso__pagina">
          <PalcoSlide class="ar-impresso__quadro" :escala="escalaImpressao">
            <SlideConteudo :slide="item" :equipe="equipe" :rotulo="rotuloDoSlide(i)" />
          </PalcoSlide>
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
  grid-template-rows: minmax(0, 1fr) auto;
  border-radius: 0;
  overflow: auto;
}

.ar-slides__deck:fullscreen {
  height: 100%;
  grid-template-rows: minmax(0, 1fr) auto;
  border-radius: 0;
  overflow: auto;
}

.ar-slides__palco {
  position: relative;
  min-height: 0;
  touch-action: pan-y;
  border-radius: var(--raio-md, 10px);
  outline: none;
}

/* O espaço do palco: na janela, a largura do deck (16:9, no máximo ~80% da altura
   da janela); em tela cheia, tudo que sobra acima dos controles. A escala sai daqui. */
.ar-slides__area {
  min-width: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 80dvh;
}

.ar-slides__deck--cheia .ar-slides__palco,
.ar-slides__deck:fullscreen .ar-slides__palco {
  height: 100%;
}

.ar-slides__deck--cheia .ar-slides__area,
.ar-slides__deck:fullscreen .ar-slides__area {
  aspect-ratio: auto;
  max-height: none;
  height: 100%;
  min-height: 0;
  display: grid;
  align-items: center;
}

/* Aviso "gire o aparelho": só celular em pé. Sem JS; o deck segue no DOM para o leitor de tela. */
.ar-slides__gire {
  display: none;
  position: absolute;
  inset: 0;
  z-index: 2;
  margin: 0;
  padding: var(--esp-4, 1rem);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--esp-3, 0.75rem);
  text-align: center;
  font-weight: 600;
  color: var(--cor-texto);
  background: var(--cor-fundo);
  border: 1px solid var(--ar-ouro, var(--cor-borda-forte));
  border-radius: var(--raio-md, 10px);
}

.ar-slides__gire-icone {
  width: 3.5rem;
  height: 3.5rem;
  fill: none;
  stroke: var(--ar-ciano, var(--cor-acento));
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (orientation: portrait) and (max-width: 700px) {
  .ar-slides__gire {
    display: flex;
    min-height: 14rem;
  }
  .ar-slides__area {
    min-height: 14rem;
  }
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

/* Páginas de impressão: só existem durante a impressão (v-if). Na tela ficam fora de vista
   mas COM layout (visibility), para o ajuste de fonte de cada slide medir de verdade. */
.ar-impresso {
  position: fixed;
  top: 0;
  left: -10000px;
  visibility: hidden;
  pointer-events: none;
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
    position: static;
    visibility: visible;
  }

  .ar-impresso__pagina {
    break-after: page;
    break-inside: avoid;
    padding: 0;
  }

  .ar-impresso__pagina:last-child {
    break-after: auto;
  }

  /* O quadro é o mesmo palco 1600x900 da tela, escalado para a página (o slide
     traz a própria paleta, então não depende de estar dentro da área restrita). */
  .ar-impresso__quadro {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .ar-impresso__notas {
    width: 270mm;
    margin: 4mm auto 0;
    color: #111111;
    font-size: 11pt;
    line-height: 1.45;
  }

  .ar-impresso__notas h3 {
    margin: 0 0 1mm;
    font-size: 11pt;
  }

  .ar-impresso__notas p {
    margin: 0;
  }
}
</style>

<style>
/* Regras globais de impressão (fora do escopo do Vue: @page só vale fora de seletor com atributo). */
@media print {
  /* Sem notas: só os slides, um por página 16:9 sem margem. Tudo do site some. */
  html.ar-imprimindo--sem-notas body > *:not(.ar-impresso) {
    display: none !important;
  }

  @page slide {
    size: 338.67mm 190.5mm;
    margin: 0;
  }

  .ar-impresso--sem-notas .ar-impresso__pagina {
    page: slide;
    width: 338.67mm;
    height: 190.5mm;
    overflow: hidden;
    break-after: page;
  }

  .ar-impresso--sem-notas .ar-impresso__pagina:last-child {
    break-after: auto;
  }

  .ar-impresso--sem-notas .ar-impresso__quadro {
    width: 100% !important;
    height: 100% !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
