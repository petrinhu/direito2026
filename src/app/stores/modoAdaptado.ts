import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
import type { RepositorioProgresso } from '@/core/progresso/tipos';

export interface StoreModoAdaptado {
  /** Preferência do leitor, a que fica salva. */
  readonly ativo: Ref<boolean>;
  /** Verdadeiro nas rotas em que o modo não se aplica (área restrita). */
  readonly suspenso: Ref<boolean>;
  /** O que de fato vale agora: preferência ligada e rota que aceita o modo. */
  readonly efetivo: ComputedRef<boolean>;
  alternar(): void;
  /** Suspende só o efeito (atributo no <html>); a preferência salva não é tocada. */
  suspender(valor: boolean): void;
}

/**
 * Reflete o estado no atributo `data-modo-adaptado`, mesmo padrão do
 * `data-theme` (src/app/stores/tema.ts): o modo liga por cima do tema já
 * escolhido, nunca o substitui (docs/modo-adaptado.md, seção 3), por isso
 * usa um atributo próprio em vez de um terceiro valor de `data-theme`.
 */
function aplicarAtributoModoAdaptado(ativo: boolean): void {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement;
  if (ativo) raiz.setAttribute('data-modo-adaptado', 'on');
  else raiz.removeAttribute('data-modo-adaptado');
}

/**
 * Composable do modo de leitura adaptada (docs/modo-adaptado.md), no mesmo
 * molde de criarStoreTema: um `ref<boolean>` iniciado pela leitura do
 * repositório, um `watch` síncrono que grava e aplica o atributo, e uma
 * função de alternância acionada pelo clique no botão do cabeçalho. Ao
 * contrário do tema, não há ciclo de três estados: é liga/desliga, porque
 * o modo nunca liga sozinho por preferência do sistema (seção 7).
 */
export function criarStoreModoAdaptado(repositorio: RepositorioProgresso): StoreModoAdaptado {
  const ativo = ref<boolean>(repositorio.lerModoAdaptado());
  const suspenso = ref(false);
  const efetivo = computed(() => ativo.value && !suspenso.value);

  watch(
    ativo,
    (valor) => {
      repositorio.salvarModoAdaptado(valor);
    },
    { immediate: true, flush: 'sync' }
  );

  watch(
    efetivo,
    (valor) => {
      aplicarAtributoModoAdaptado(valor);
    },
    // síncrono de propósito, mesma razão de criarStoreTema: o atributo no
    // <html> precisa refletir na hora do clique, sem esperar o próximo
    // tick do agendador do Vue.
    { immediate: true, flush: 'sync' }
  );

  function alternar(): void {
    ativo.value = !ativo.value;
  }

  function suspender(valor: boolean): void {
    suspenso.value = valor;
  }

  return { ativo, suspenso, efetivo, alternar, suspender };
}
