<script setup lang="ts">
/* global MediaQueryList, MutationObserver, ResizeObserver */
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch
} from 'vue';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import { medirJanela, temWebGL2, temaEscuro } from '@/app/piramide3d/ambiente';
import { carregarMotor } from '@/app/piramide3d/carregarMotor';
import { decidirModo } from '@/app/piramide3d/decidirModo';
import { usarMovimentoReduzido } from '@/app/piramide3d/movimentoReduzido';
import type { ControleSom, EstadoSom, FiguraMontada } from '@/app/piramide3d/tiposMotor';
import type { ChaveFigura3d, DadosFigura3d } from '@/core/piramide3d/tipos';
import './estilo.css';

const props = defineProps<{ chave: ChaveFigura3d; dados: DadosFigura3d }>();

const lojaAdaptado = inject(CHAVE_STORE_MODO_ADAPTADO, null);
const modoAdaptado = computed(() => lojaAdaptado?.efetivo.value ?? false);
const reduzido = usarMovimentoReduzido();

const raiz = ref<HTMLElement>();
const palco = ref<HTMLElement>();
/** O 3D está na tela. Enquanto for falso, o componente fica escondido e a versão plana aparece. */
const em3d = ref(false);
const estadoSom = ref<EstadoSom>({ disponivel: false, desbloqueado: false, ativo: true });
const rotuloSom = computed(() => {
  if (!estadoSom.value.desbloqueado) return 'Som: clique para ligar';
  return estadoSom.value.ativo ? 'Som ligado' : 'Som desligado';
});

let figura: HTMLElement | null = null;
let montada: FiguraMontada | null = null;
const som = shallowRef<ControleSom | null>(null);
let deixarDeOuvirSom: (() => void) | null = null;
let perto = false;
let carregando = false;
// Carga ou criação que falhou: não insiste até algo mudar (tema, movimento), para não girar em falso.
let falhou = false;
let destruido = false;
// Cada desmontagem invalida a carga em andamento: um motor que chega atrasado não monta.
let geracao = 0;
let observadorPosicao: IntersectionObserver | undefined;
let observadorTamanho: ResizeObserver | undefined;
let observadorTema: MutationObserver | undefined;
let consultaEscuro: MediaQueryList | undefined;

function marcarFigura(ligado: boolean): void {
  if (!figura) return;
  if (ligado) figura.setAttribute('data-3d', 'on');
  else figura.removeAttribute('data-3d');
}

function atualizarEstadoSom(): void {
  if (som.value) estadoSom.value = { ...som.value.estado() };
}

function desmontar(): void {
  geracao++;
  deixarDeOuvirSom?.();
  deixarDeOuvirSom = null;
  som.value = null;
  if (montada) {
    montada.destruir();
    montada = null;
  }
  em3d.value = false;
  marcarFigura(false);
}

async function montar(): Promise<void> {
  if (montada || carregando) return;
  carregando = true;
  const minhaGeracao = ++geracao;
  try {
    const motor = await carregarMotor();
    if (destruido || minhaGeracao !== geracao) return;
    em3d.value = true;
    await nextTick();
    if (destruido || minhaGeracao !== geracao || !palco.value) return;
    const criada = motor.criarFigura({
      palco: palco.value,
      chave: props.chave,
      dados: props.dados,
      reduzido: reduzido.value,
      escuro: temaEscuro()
    });
    if (!criada) {
      falhou = true;
      em3d.value = false;
      return;
    }
    montada = criada;
    som.value = motor.obterSom(reduzido.value);
    som.value.definirReduzido(reduzido.value);
    deixarDeOuvirSom = som.value.ouvir(atualizarEstadoSom);
    atualizarEstadoSom();
    marcarFigura(true);
  } catch {
    // O pedaço do motor não chegou: fica a versão plana, que traz a informação inteira.
    falhou = true;
    em3d.value = false;
  } finally {
    carregando = false;
    if (!destruido && !montada && !falhou) reavaliar();
  }
}

function reavaliar(): void {
  if (destruido || !figura) return;
  const janela = medirJanela();
  const modo = decidirModo({
    webgl2: temWebGL2(),
    larguraJanela: janela.largura,
    alturaJanela: janela.altura,
    larguraFigura: figura.getBoundingClientRect().width,
    modoAdaptado: modoAdaptado.value
  });
  if (modo === 'plana') {
    if (montada || em3d.value || carregando) desmontar();
    return;
  }
  if (montada) {
    montada.redimensionar();
    return;
  }
  if (perto && !carregando && !falhou) void montar();
}

function refazer(): void {
  falhou = false;
  if (montada) desmontar();
  reavaliar();
}

onMounted(() => {
  figura = raiz.value?.closest('figure') ?? null;
  if (!figura) return;
  if (typeof IntersectionObserver === 'function') {
    // Margem de uma tela: o motor começa a chegar um pouco antes de a figura aparecer.
    observadorPosicao = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        perto = true;
        reavaliar();
      },
      { rootMargin: '100% 0px' }
    );
    observadorPosicao.observe(figura);
  } else {
    perto = true;
  }
  if (typeof ResizeObserver === 'function') {
    observadorTamanho = new ResizeObserver(reavaliar);
    observadorTamanho.observe(figura);
  }
  window.addEventListener('resize', reavaliar);
  if (typeof MutationObserver === 'function') {
    observadorTema = new MutationObserver(refazer);
    observadorTema.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
  // Sem data-theme o tema segue o sistema: a troca do sistema também refaz a figura.
  if (typeof matchMedia === 'function') {
    consultaEscuro = matchMedia('(prefers-color-scheme: dark)');
    consultaEscuro.addEventListener('change', refazer);
  }
  reavaliar();
});

watch(modoAdaptado, reavaliar);
watch(reduzido, refazer);

onBeforeUnmount(() => {
  destruido = true;
  observadorPosicao?.disconnect();
  observadorTamanho?.disconnect();
  observadorTema?.disconnect();
  consultaEscuro?.removeEventListener('change', refazer);
  window.removeEventListener('resize', reavaliar);
  desmontar();
});
</script>

<template>
  <div ref="raiz" class="figura-piramide3d" :hidden="!em3d">
    <div
      v-if="em3d && estadoSom.disponivel"
      class="figura-piramide3d__controles"
      data-controles-som
    >
      <button
        type="button"
        class="figura-piramide3d__botao"
        :aria-pressed="estadoSom.desbloqueado && estadoSom.ativo ? 'true' : 'false'"
        @click="som?.alternar()"
      >
        {{ rotuloSom }}
      </button>
      <button type="button" class="figura-piramide3d__botao" @click="som?.testar()">
        Testar som
      </button>
      <span v-if="!estadoSom.desbloqueado" class="figura-piramide3d__aviso">
        Clique na página para ativar o som.
      </span>
    </div>
    <div ref="palco" class="figura-piramide3d__palco" />
  </div>
</template>
