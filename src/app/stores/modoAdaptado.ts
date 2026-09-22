import { ref, watch, type Ref } from 'vue';
import type { RepositorioProgresso } from '@/core/progresso/tipos';

export interface StoreModoAdaptado {
  readonly ativo: Ref<boolean>;
  alternar(): void;
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

  watch(
    ativo,
    (valor) => {
      repositorio.salvarModoAdaptado(valor);
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

  return { ativo, alternar };
}
