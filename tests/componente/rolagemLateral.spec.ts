// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { temRolagemLateral, usarRolagemLateral } from '@/ui/componentes/rolagemLateral';

/**
 * A11Y-TABINDEX-TABELA: a região rolável só entra na ordem de Tab (tabindex 0) quando o conteúdo é mais
 * largo que a janela. Sem rolagem, leitor de tela e teclado não param numa região que não rola.
 */

const medidas = { conteudo: 0, janela: 0 };
let aoRedimensionar: (() => void) | undefined;

class ObservadorFalso {
  constructor(callback: () => void) {
    aoRedimensionar = callback;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
  configurable: true,
  get: () => medidas.conteudo
});
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get: () => medidas.janela
});

afterEach(() => {
  vi.unstubAllGlobals();
  aoRedimensionar = undefined;
  medidas.conteudo = 0;
  medidas.janela = 0;
});

describe('temRolagemLateral', () => {
  it('há rolagem só quando o conteúdo é mais largo que a janela', () => {
    expect(temRolagemLateral({ scrollWidth: 800, clientWidth: 600 })).toBe(true);
    expect(temRolagemLateral({ scrollWidth: 600, clientWidth: 600 })).toBe(false);
    expect(temRolagemLateral({ scrollWidth: 500, clientWidth: 600 })).toBe(false);
  });
});

function montarRegiao(comRegiao: { valor: boolean }) {
  vi.stubGlobal('ResizeObserver', ObservadorFalso);
  const alvo = ref<HTMLElement>();
  const mostrar = ref(comRegiao.valor);
  const Teste = defineComponent({
    setup() {
      const { tabindex } = usarRolagemLateral(alvo);
      return () =>
        mostrar.value
          ? h(
              'div',
              { ref: alvo, role: 'region', 'aria-label': 'Tabela', tabindex: tabindex.value },
              [h('table', [h('tr', [h('td', 'conteúdo')])])]
            )
          : h('p', 'carregando');
    }
  });
  const wrapper = mount(Teste, { attachTo: document.body });
  return { wrapper, mostrar };
}

describe('usarRolagemLateral', () => {
  it('sem rolagem, a região não entra na ordem de Tab', async () => {
    medidas.conteudo = 400;
    medidas.janela = 400;
    const { wrapper } = montarRegiao({ valor: true });
    await nextTick();
    expect(wrapper.get('[role="region"]').attributes('tabindex')).toBeUndefined();
    wrapper.unmount();
  });

  it('com rolagem, a região recebe tabindex 0', async () => {
    medidas.conteudo = 900;
    medidas.janela = 400;
    const { wrapper } = montarRegiao({ valor: true });
    await nextTick();
    await nextTick();
    expect(wrapper.get('[role="region"]').attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('reavalia no resize: a janela cresce e a rolagem some, o tabindex sai', async () => {
    medidas.conteudo = 900;
    medidas.janela = 400;
    const { wrapper } = montarRegiao({ valor: true });
    await nextTick();
    await nextTick();
    expect(wrapper.get('[role="region"]').attributes('tabindex')).toBe('0');

    medidas.janela = 1000;
    aoRedimensionar?.();
    await nextTick();
    expect(wrapper.get('[role="region"]').attributes('tabindex')).toBeUndefined();
    wrapper.unmount();
  });

  it('avalia quando a região aparece depois (tabela entra após o carregamento)', async () => {
    medidas.conteudo = 900;
    medidas.janela = 400;
    const { wrapper, mostrar } = montarRegiao({ valor: false });
    await nextTick();
    expect(wrapper.find('[role="region"]').exists()).toBe(false);

    mostrar.value = true;
    await nextTick();
    await nextTick();
    expect(wrapper.get('[role="region"]').attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });
});
