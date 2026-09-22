<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { IndiceDispositivos } from '@/core/dispositivos/tipos';
import { montarRotuloDispositivo } from '@/app/dispositivos/rotulo';
import { criarControladorCitacoes, type PontoPonteiro } from './citacoes';

const props = defineProps<{
  /** Elemento raiz de conteúdo onde as citações aparecem (v-html). */
  regiao: HTMLElement | undefined;
  dispositivos: IndiceDispositivos | undefined;
}>();

const balaoRef = ref<HTMLElement | undefined>();
const dispositivoAtualId = ref<string | undefined>();
const ancoraAtual = ref<HTMLElement | undefined>();
/**
 * Ordem do líder, 22/09/2026: o balão abre junto do ponto onde está o
 * ponteiro, não num lugar fixo nem sempre âncorado ao botão inteiro.
 * Só existe quando a abertura veio de hover de mouse; clique, toque e
 * teclado continuam âncorados ao próprio elemento (seção 12.3).
 */
const pontoAtual = ref<PontoPonteiro | undefined>();

const dispositivoAtual = computed(() =>
  dispositivoAtualId.value && props.dispositivos
    ? props.dispositivos[dispositivoAtualId.value]
    : undefined
);

const rotulo = computed(() =>
  dispositivoAtual.value ? montarRotuloDispositivo(dispositivoAtual.value) : ''
);

let controlador: ReturnType<typeof criarControladorCitacoes> | undefined;

async function posicionar(): Promise<void> {
  const balao = balaoRef.value;
  const ancora = ancoraAtual.value;
  if (!balao || !ancora) return;

  const ponto = pontoAtual.value;

  // Limpa resíduo do outro caminho: como a escolha agora também depende
  // do ponto (não só do navegador), uma abertura pode trocar de caminho
  // em relação à anterior, e um estilo inline sobrando de um caminho
  // atrapalharia o outro.
  ancora.style.removeProperty('anchor-name');
  balao.style.removeProperty('position-anchor');
  balao.style.removeProperty('position');
  balao.style.removeProperty('left');
  balao.style.removeProperty('top');

  // Sem "ponto do ponteiro" (o mouse não abriu o balão: foi clique, toque
  // ou teclado) o anchor positioning nativo se aplica normalmente, porque
  // aí faz sentido âncorar ao elemento inteiro.
  const suportaAnchorPositioning =
    !ponto && typeof CSS !== 'undefined' && CSS.supports?.('position-try-fallbacks', 'flip-block');

  if (suportaAnchorPositioning) {
    // Caminho preferido, CSS puro (seção 12.4): o controlador só põe o
    // anchor-name no botão ativo, um de cada vez.
    ancora.style.setProperty('anchor-name', '--citacao-ativa');
    balao.style.setProperty('position-anchor', '--citacao-ativa');
    return;
  }

  // Contorno: importado só neste ramo. Quem tem suporte nativo completo E
  // não abriu por hover de mouse não baixa nada; abertura por hover
  // sempre passa por aqui, porque é o único jeito de seguir um ponto
  // qualquer (anchor positioning nativo só âncora a um elemento real).
  const { computePosition, offset, flip, shift, size } = await import('@floating-ui/dom');
  const referencia = ponto
    ? {
        getBoundingClientRect: () => ({
          x: ponto.x,
          y: ponto.y,
          left: ponto.x,
          top: ponto.y,
          right: ponto.x,
          bottom: ponto.y,
          width: 0,
          height: 0
        }),
        contextElement: ancora
      }
    : ancora;
  const posicao = await computePosition(referencia, balao, {
    placement: 'top',
    // 'fixed' porque é a estratégia que o balão de fato usa (linha de
    // baixo). Sem isto, computePosition() assume 'absolute' (relativo ao
    // documento, soma o scroll da página) e o resultado, aplicado com
    // position:fixed (relativo à janela), fica certo só com a página no
    // topo - rolada, o balão nasce fora da tela. É provavelmente a causa
    // de fundo do relato do líder, 22/09/2026: "abrindo num local fixo".
    strategy: 'fixed',
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
      size({
        apply({ availableWidth, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxWidth: `${Math.min(availableWidth, 480)}px`,
            maxHeight: `${Math.min(availableHeight, window.innerHeight * 0.4)}px`
          });
        }
      })
    ]
  });
  Object.assign(balao.style, { left: `${posicao.x}px`, top: `${posicao.y}px`, position: 'fixed' });
}

async function abrir(id: string, ancora: HTMLElement, ponto?: PontoPonteiro): Promise<void> {
  dispositivoAtualId.value = id;
  ancoraAtual.value = ancora;
  pontoAtual.value = ponto;
  balaoRef.value?.showPopover?.();
  await nextTick();
  await posicionar();
}

function fechar(): void {
  balaoRef.value?.hidePopover?.();
  dispositivoAtualId.value = undefined;
  ancoraAtual.value = undefined;
  pontoAtual.value = undefined;
}

watch(
  () => props.regiao,
  (nova, antiga) => {
    if (antiga) controlador?.desligar();
    if (!nova) return;
    controlador = criarControladorCitacoes({
      dispositivos: () => props.dispositivos,
      aoAbrir: abrir,
      aoFechar: fechar
    });
    controlador.ligar(nova);
    // Ordem líder 22/09/2026, requisito hoverable: o balão precisa dos
    // mesmos escutadores de hover que o botão, para o ponteiro poder
    // atravessar de um para o outro (seção 12.3). balaoRef já existe
    // aqui porque este watch roda depois do onMounted na prática (o
    // <template> é montado antes de props.regiao chegar do pai), mas
    // onMounted abaixo cobre também a ordem inversa.
    if (balaoRef.value) controlador.ligarBalao(balaoRef.value);
  },
  { immediate: true }
);

onMounted(() => {
  if (controlador && balaoRef.value) controlador.ligarBalao(balaoRef.value);
  // 'auto' entrega, de graça, fechamento por Esc e por clique fora (seção 12.2).
  balaoRef.value?.addEventListener('toggle', (evento: Event) => {
    const toggleEvento = evento as Event & { newState?: string };
    if (toggleEvento.newState === 'closed') fechar();
  });
});

onBeforeUnmount(() => controlador?.desligar());
</script>

<template>
  <div
    id="balao-dispositivo"
    ref="balaoRef"
    popover="auto"
    role="note"
    aria-live="polite"
    class="balao-dispositivo"
  >
    <template v-if="dispositivoAtual">
      <p v-if="dispositivoAtual.notaAlteracao" class="balao-dispositivo__nota">
        {{ dispositivoAtual.notaAlteracao }}
      </p>
      <p class="balao-dispositivo__redacao">{{ dispositivoAtual.texto }}</p>
      <p class="balao-dispositivo__rodape">
        {{ rotulo }} · consultado em {{ dispositivoAtual.dataConsulta }} ·
        <a :href="dispositivoAtual.urlFonte" target="_blank" rel="noopener">fonte oficial</a>
      </p>
    </template>
    <template v-else-if="dispositivoAtualId">
      <p>Redação não disponível sem conexão.</p>
    </template>
  </div>
</template>

<style scoped>
.balao-dispositivo {
  max-inline-size: min(36ch, calc(100vw - 32px));
  max-block-size: 40vh;
  overflow: auto;
  border: 1px solid var(--cor-borda-forte, #c3bca4);
  border-radius: var(--raio-md, 10px);
  background: var(--cor-fundo-elevado, #fff);
  box-shadow: var(--sombra-elevada, 0 8px 24px rgba(0, 0, 0, 0.12));
  padding: var(--esp-4, 1rem);
  position-area: top;
  position-try-fallbacks: flip-block, flip-inline;
  position-visibility: anchors-visible;
  margin: 0;
}

.balao-dispositivo__nota {
  color: var(--cor-bordo, #7a2331);
  font-weight: 600;
}

.balao-dispositivo__rodape {
  font-size: var(--escala-xs, 0.8125rem);
  color: var(--cor-texto-suave, #4a4a4a);
}

@media (max-width: 640px), (pointer: coarse) {
  .balao-dispositivo {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    top: auto;
    max-inline-size: none;
    width: 100%;
    border-radius: var(--raio-lg, 16px) var(--raio-lg, 16px) 0 0;
  }
}
</style>
