<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { contadorProva } from '@/app/calendario/contadorProva';
import {
  gravarEscolha,
  gravarSemEscolha,
  lerEscolha,
  type ArmazenamentoSimples
} from '@/app/calendario/estadoQuadroProva';
import type { NivelUrgencia } from '@/core/calendario/tipos';
import ModalCalendario from './ModalCalendario.vue';

/**
 * Quadro flutuante de contagem (ordem do líder, 20/10/2026): aparece em
 * todas as páginas, cresce e muda de cor conforme a prova chega, e pode ser
 * minimizado. `agora` é injetável para teste; sem ele, usa o relógio.
 * `minimizadoPorPadrao` é o padrão da página (hoje, a do calendário, que repete
 * o que o calendário já mostra e cobre ANTERIOR, HOJE e PRÓXIMO quando aberto).
 * Vale só sem escolha gravada: se a pessoa tocar em Mostrar, a escolha vale.
 */
const props = defineProps<{ agora?: Date; minimizadoPorPadrao?: boolean }>();

const contador = computed(() => contadorProva(props.agora ?? new Date()));

function armazenamentoPadrao(): ArmazenamentoSimples | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * Modo adaptado em tela de até 340px (decisão do líder, 20/10/2026): o quadro
 * começa minimizado, a letra continua grande, e só abre se a pessoa tocar em
 * Mostrar. O modo vem do atributo data-modo-adaptado no <html> (o mesmo que o
 * MapaMentalVisor lê), e a largura, de matchMedia. Os dois reagem com a página
 * aberta. Sem escolha da pessoa, vale o padrão; com escolha, vale a escolha.
 */
const CONSULTA_TELA_ESTREITA = '(max-width: 340px)';
const consultaTelaEstreita =
  typeof matchMedia === 'function' ? matchMedia(CONSULTA_TELA_ESTREITA) : undefined;

function modoAdaptadoLigadoNaRaiz(): boolean {
  return document.documentElement.getAttribute('data-modo-adaptado') === 'on';
}

const modoAdaptadoLigado = ref(modoAdaptadoLigadoNaRaiz());
const telaEstreita = ref(consultaTelaEstreita?.matches ?? false);
const padraoMinimizado = computed(
  () => (props.minimizadoPorPadrao ?? false) || (modoAdaptadoLigado.value && telaEstreita.value)
);

// Só o toque da pessoa (Mostrar ou Minimizar) conta como escolha na faixa atual.
const escolhaDaPessoa = ref<boolean | undefined>(
  contador.value ? lerEscolha(armazenamentoPadrao(), contador.value.faixa) : undefined
);
const minimizado = computed(() => escolhaDaPessoa.value ?? padraoMinimizado.value);

let observadorModo: InstanceType<typeof window.MutationObserver> | undefined;

function aoMudarLargura(): void {
  telaEstreita.value = consultaTelaEstreita?.matches ?? false;
}

onMounted(() => {
  consultaTelaEstreita?.addEventListener('change', aoMudarLargura);
  observadorModo = new window.MutationObserver(() => {
    modoAdaptadoLigado.value = modoAdaptadoLigadoNaRaiz();
  });
  observadorModo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-modo-adaptado']
  });
});

onBeforeUnmount(() => {
  consultaTelaEstreita?.removeEventListener('change', aoMudarLargura);
  observadorModo?.disconnect();
});

// Mudou de faixa de urgência: a escolha da faixa anterior não vale mais. O reset
// não conta como escolha da pessoa, então o padrão de cada caso volta a valer.
watch(
  () => contador.value?.faixa,
  (faixa, anterior) => {
    if (!faixa || faixa === anterior) return;
    escolhaDaPessoa.value = undefined;
    gravarSemEscolha(armazenamentoPadrao(), faixa);
  }
);

function alternar(): void {
  const faixa = contador.value?.faixa;
  if (!faixa) return;
  escolhaDaPessoa.value = !minimizado.value;
  gravarEscolha(armazenamentoPadrao(), faixa, escolhaDaPessoa.value);
}

function resumoCurto(dias: number): string {
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  return `${dias} dias`;
}

const faixaAtual = computed<NivelUrgencia | undefined>(() => contador.value?.faixa);

/**
 * O calendário abre numa janela modal, sem trocar de página (ordem do líder,
 * 20/10/2026). O botão recebe o foco antes de abrir: o Safari não foca botão
 * clicado com o mouse, e o foco tem de voltar a ele ao fechar a janela.
 */
const calendarioAberto = ref(false);
const botaoAbrirCalendario = ref<HTMLButtonElement>();

function abrirCalendario(): void {
  botaoAbrirCalendario.value?.focus();
  calendarioAberto.value = true;
}
</script>

<template>
  <aside
    v-if="contador"
    class="quadro-prova"
    :class="[`quadro-prova--${faixaAtual}`, { 'quadro-prova--minimizado': minimizado }]"
    :data-faixa="faixaAtual"
    aria-label="Contagem para a próxima prova"
  >
    <div class="quadro-prova__topo">
      <span class="quadro-prova__pilula">{{ resumoCurto(contador.dias) }}</span>
      <button
        type="button"
        class="quadro-prova__alternar"
        :aria-expanded="minimizado ? 'false' : 'true'"
        :aria-controls="minimizado ? undefined : 'quadro-prova-texto'"
        @click="alternar"
      >
        {{ minimizado ? 'Mostrar' : 'Minimizar' }}
        <span class="visualmente-oculto">o quadro de contagem</span>
      </button>
    </div>
    <div v-if="!minimizado" id="quadro-prova-texto" data-testid="quadro-texto">
      <p class="quadro-prova__texto">{{ contador.texto }}</p>
      <button
        ref="botaoAbrirCalendario"
        type="button"
        class="quadro-prova__link"
        aria-haspopup="dialog"
        @click="abrirCalendario"
      >
        Abrir o calendário
      </button>
    </div>
    <ModalCalendario v-model:aberto="calendarioAberto" :agora="props.agora" />
  </aside>
</template>

<style scoped>
.quadro-prova {
  pointer-events: auto;
  width: min(100%, 22rem);
  margin-left: auto;
  margin-right: var(--esp-4, 1rem);
  padding: var(--esp-3, 0.75rem) var(--esp-4, 1rem);
  border-radius: var(--raio-lg, 16px);
  border: 1px solid var(--cor-borda-forte, #c3bca4);
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-texto, #1c1c1c);
  box-shadow: var(--sombra-elevada, 0 8px 24px rgba(13, 36, 64, 0.12));
  font-size: var(--escala-sm, 0.9375rem);
}

/* Minimizado sobra só a pílula e o botão Mostrar: encolhe na largura também,
   sem passar do teto de 22rem. A ancoragem à direita (margin-left: auto) vale. */
.quadro-prova--minimizado {
  width: max-content;
  max-width: min(100%, 22rem);
}

.quadro-prova__topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--esp-3, 0.75rem);
}

/* A pílula leva a cor da faixa: usa só pares já medidos no portão de contraste
   (categorias do calendário, fixas nos dois temas). Cresce com a urgência. */
.quadro-prova__pilula {
  display: inline-block;
  padding: var(--esp-1, 0.25rem) var(--esp-3, 0.75rem);
  border-radius: var(--raio-md, 10px);
  background: var(--cor-cal-av1-fundo, #163a5f);
  color: var(--cor-cal-av1-texto, #ffffff);
  font-weight: 600;
  line-height: 1.2;
}

.quadro-prova--calmo .quadro-prova__pilula {
  font-size: var(--escala-sm, 0.9375rem);
}

.quadro-prova--dourado {
  border: 2px solid var(--cor-acento, #7c621c);
}

.quadro-prova--dourado .quadro-prova__pilula {
  background: var(--cor-cal-av2-fundo, #7c621c);
  color: var(--cor-cal-av2-texto, #ffffff);
  font-size: var(--escala-base, 1.0625rem);
}

.quadro-prova--garnet {
  border: 2px solid var(--cor-bordo, #7a2331);
}

.quadro-prova--garnet .quadro-prova__pilula {
  background: var(--cor-cal-av3-fundo, #7a2331);
  color: var(--cor-cal-av3-texto, #ffffff);
  font-size: var(--escala-md, 1.25rem);
}

.quadro-prova--pulsante {
  border: 3px solid var(--cor-bordo, #7a2331);
}

.quadro-prova--pulsante .quadro-prova__pilula {
  background: var(--cor-cal-av3-fundo, #7a2331);
  color: var(--cor-cal-av3-texto, #ffffff);
  font-size: var(--escala-lg, 1.75rem);
}

/* Pulso só para quem não pediu menos movimento e não está no modo adaptado
   (ordem do líder: nesses casos muda só cor e tamanho). */
@media (prefers-reduced-motion: no-preference) {
  :root:not([data-modo-adaptado='on']) .quadro-prova--pulsante {
    animation: quadro-prova-pulsar 1.6s ease-in-out infinite;
  }
}

@keyframes quadro-prova-pulsar {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(122, 35, 49, 0.45);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(122, 35, 49, 0);
  }
}

.quadro-prova__alternar {
  min-height: 44px;
  min-width: 44px;
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
  background: none;
  border: none;
  color: var(--cor-texto, #1c1c1c);
  text-decoration: underline;
  font: inherit;
  font-size: var(--escala-xs, 0.8125rem);
  cursor: pointer;
}

.quadro-prova__texto {
  margin: var(--esp-2, 0.5rem) 0 0;
  font-weight: 600;
}

.quadro-prova__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0;
  background: none;
  border: none;
  font: inherit;
  color: var(--cor-primaria, #163a5f);
  text-decoration: underline;
  cursor: pointer;
}

.quadro-prova__alternar:focus-visible,
.quadro-prova__link:focus-visible {
  outline: 2px solid var(--cor-foco, #163a5f);
  outline-offset: 2px;
}

.visualmente-oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* Modo adaptado: preto sobre branco, sem pulso e com contorno, por desenho. */
:root[data-modo-adaptado='on'] .quadro-prova {
  background: #ffffff;
  color: #000000;
  border: 3px solid #000000;
}

:root[data-modo-adaptado='on'] .quadro-prova__pilula {
  background: #ffffff;
  color: #000000;
  border: 2px solid #000000;
}

:root[data-modo-adaptado='on'] .quadro-prova__link,
:root[data-modo-adaptado='on'] .quadro-prova__alternar {
  color: #000000;
}

@media print {
  .quadro-prova {
    display: none;
  }
}
</style>
