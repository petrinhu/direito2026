/* global ResizeObserver */
import { computed, ref, watch, onBeforeUnmount, type Ref } from 'vue';

/** Há rolagem lateral quando o conteúdo é mais largo que a caixa que o mostra. */
export function temRolagemLateral(medidas: { scrollWidth: number; clientWidth: number }): boolean {
  return medidas.scrollWidth > medidas.clientWidth;
}

/**
 * Devolve o `tabindex` da região rolável: 0 só quando ela de fato rola, ou nada (sem atributo).
 * Reavalia quando a própria região muda de tamanho e quando a tabela dentro dela muda de largura
 * (o conteúdo cresce sem a região mudar de caixa, então o observador vigia o filho também).
 */
export function usarRolagemLateral(alvo: Ref<HTMLElement | undefined>) {
  const rola = ref(false);
  let observador: ResizeObserver | undefined;

  function avaliar(): void {
    const el = alvo.value;
    rola.value = el !== undefined && temRolagemLateral(el);
  }

  watch(
    alvo,
    (el) => {
      observador?.disconnect();
      observador = undefined;
      if (!el) {
        rola.value = false;
        return;
      }
      avaliar();
      if (typeof ResizeObserver === 'undefined') return;
      observador = new ResizeObserver(avaliar);
      observador.observe(el);
      for (const filho of Array.from(el.children)) observador.observe(filho);
    },
    { flush: 'post', immediate: true }
  );

  onBeforeUnmount(() => observador?.disconnect());

  return { tabindex: computed(() => (rola.value ? 0 : undefined)) };
}
