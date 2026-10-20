<script setup lang="ts">
import { defineAsyncComponent, h, ref, watch } from 'vue';

/**
 * Calendário em janela modal (ordem do líder, 20/10/2026): abre por cima da
 * página atual, sem trocar de rota. É um <dialog> com showModal(), que prende o
 * foco e fecha com Esc (evento cancel, tratado aqui para o estado ficar num
 * lugar só). Fecha com o botão Fechar ou com clique no fundo; clique no
 * conteúdo não fecha. O conteúdo é o mesmo da página, carregado só ao abrir.
 */
const props = defineProps<{ agora?: Date }>();
const aberto = defineModel<boolean>('aberto', { required: true });

// O tipo sai de window: o eslint do projeto não lista HTMLDialogElement como global.
const dialogo = ref<InstanceType<typeof window.HTMLDialogElement>>();
let focoAoAbrir: HTMLElement | null = null;
let origemDoPonteiro: EventTarget | null = null;

const CalendarioCompleto = defineAsyncComponent({
  loader: () => import('./CalendarioCompleto.vue'),
  loadingComponent: () =>
    h(
      'p',
      { class: 'modal-calendario__estado', role: 'status', 'aria-busy': 'true' },
      'Carregando o calendário…'
    ),
  errorComponent: () =>
    h(
      'p',
      { class: 'modal-calendario__estado', role: 'alert' },
      'Não foi possível carregar o calendário. Feche esta janela e abra de novo.'
    ),
  onError: (_erro, tentar, falhar, tentativas) => (tentativas <= 2 ? tentar() : falhar())
});

watch(aberto, (valor) => {
  const el = dialogo.value;
  if (!el) return;
  if (valor) {
    focoAoAbrir = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!el.hasAttribute('open')) el.showModal();
    document.documentElement.style.overflow = 'hidden';
    return;
  }
  if (el.hasAttribute('open')) el.close();
  document.documentElement.style.overflow = '';
  focoAoAbrir?.focus();
  focoAoAbrir = null;
});

function fechar(): void {
  aberto.value = false;
}

function aoFecharNativo(): void {
  // O navegador já fechou (caminho que o cancel não cobre): o estado acompanha.
  if (aberto.value) fechar();
}

function aoPressionarPonteiro(evento: PointerEvent): void {
  origemDoPonteiro = evento.target;
}

/**
 * Fecha só quando o toque começou e terminou no fundo (o próprio dialog). Um
 * arrasto que começa no texto e solta fora dele não fecha a janela.
 */
function aoClicarNoFundo(evento: MouseEvent): void {
  const fundo = dialogo.value;
  const comecouNoFundo = origemDoPonteiro === fundo;
  origemDoPonteiro = null;
  if (evento.target === fundo && comecouNoFundo) fechar();
}
</script>

<template>
  <dialog
    ref="dialogo"
    class="modal-calendario"
    aria-labelledby="modal-calendario-titulo"
    @cancel.prevent="fechar"
    @close="aoFecharNativo"
    @pointerdown="aoPressionarPonteiro"
    @click="aoClicarNoFundo"
  >
    <div class="modal-calendario__caixa">
      <header class="modal-calendario__cabecalho">
        <h2 id="modal-calendario-titulo" class="modal-calendario__titulo">Calendário</h2>
        <button type="button" class="modal-calendario__fechar" @click="fechar">Fechar</button>
      </header>
      <div class="modal-calendario__corpo">
        <CalendarioCompleto v-if="aberto" :agora="props.agora" />
      </div>
    </div>
  </dialog>
</template>

<style scoped>
/* Mobile first: quase tela cheia. 100dvh com 100vh de reserva (barra dinâmica). */
.modal-calendario {
  inset: 0;
  margin: auto;
  width: calc(100% - 1rem);
  max-width: none;
  height: calc(100vh - 1rem);
  height: calc(100dvh - 1rem);
  max-height: none;
  padding: 0;
  border: 1px solid var(--cor-borda-forte, #c3bca4);
  border-radius: var(--raio-lg, 16px);
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-texto, #1c1c1c);
  box-shadow: var(--sombra-elevada, 0 8px 24px rgba(13, 36, 64, 0.12));
  font-size: var(--escala-base, 1.0625rem);
  overflow: hidden;
}

.modal-calendario[open] {
  display: flex;
  flex-direction: column;
}

.modal-calendario::backdrop {
  background: rgba(10, 20, 32, 0.6);
}

.modal-calendario__caixa {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.modal-calendario__cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--esp-3, 0.75rem);
  padding: var(--esp-3, 0.75rem) var(--esp-4, 1rem);
  border-bottom: 1px solid var(--cor-borda, #dcd7c8);
}

.modal-calendario__titulo {
  margin: 0;
  font-family: var(--fonte-titulo);
  font-size: var(--escala-lg, 1.75rem);
  color: var(--cor-titulo-texto, #0d2440);
}

.modal-calendario__fechar {
  min-height: 44px;
  min-width: 44px;
  padding: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  border: 1px solid var(--cor-primaria, #163a5f);
  border-radius: var(--raio-md, 10px);
  background: var(--cor-primaria, #163a5f);
  color: var(--cor-texto-invertido, #faf9f5);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.modal-calendario__fechar:focus-visible {
  outline: 2px solid var(--cor-foco, #163a5f);
  outline-offset: 2px;
}

/* Só o corpo rola: a cabeçalho com o botão Fechar fica sempre à vista. */
.modal-calendario__corpo {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--esp-4, 1rem);
}

.modal-calendario__estado {
  margin: 0;
  font-weight: 600;
}

@media (min-width: 641px) {
  .modal-calendario {
    width: min(1100px, calc(100% - 2rem));
    height: auto;
    max-height: calc(100dvh - 2rem);
  }
}

/* Modo adaptado: preto sobre branco, 24px no corpo (--escala-base), contorno forte. */
:root[data-modo-adaptado='on'] .modal-calendario {
  background: #ffffff;
  color: #000000;
  border: 3px solid #000000;
}

:root[data-modo-adaptado='on'] .modal-calendario__cabecalho {
  border-bottom: 2px solid #000000;
}

:root[data-modo-adaptado='on'] .modal-calendario__titulo {
  color: #000000;
}

:root[data-modo-adaptado='on'] .modal-calendario__fechar {
  background: #ffffff;
  border: 2px solid #000000;
  color: #000000;
}
</style>
