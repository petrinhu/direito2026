// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import MapaMentalVisor from '@/ui/componentes/MapaMentalVisor.vue';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import { ref } from 'vue';
import { DADOS_SINTETICOS } from '../unidade/apoio/dadosFichamento';

const criar = vi.fn();
vi.mock('markmap-view', () => ({
  Markmap: {
    create: () => {
      const estado: { data?: unknown } = {};
      return {
        state: estado,
        toggleNode: async () => {},
        setData: async (dados: unknown) => {
          estado.data = dados;
          criar(dados);
        },
        renderData: async () => {},
        setOptions: () => {},
        destroy: () => {}
      };
    }
  }
}));

let wrapper: VueWrapper | undefined;

function montar(adaptado = false) {
  wrapper = mount(MapaMentalVisor, {
    props: { dados: DADOS_SINTETICOS, baseUnidade: '/p/p1/c/u1' },
    attachTo: document.body,
    global: {
      provide: {
        [CHAVE_STORE_MODO_ADAPTADO as unknown as symbol]: { ativo: ref(adaptado), alternar() {} }
      }
    }
  });
  return wrapper;
}

afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = '';
});

describe('MapaMentalVisor', () => {
  it('começa no mapa visual, com o botão para ver em lista', () => {
    montar();
    expect(wrapper!.find('.mapa-visual').exists()).toBe(true);
    expect(wrapper!.find('[role="tree"]').exists()).toBe(false);
    expect(wrapper!.find('button.mapa-mental__modo').text()).toBe('Ver em lista');
  });

  it('o mapa visual abre com o markmap, a árvore de pensadores e o botão Abrir todos os ramos', async () => {
    criar.mockClear();
    montar();
    await vi.waitFor(() => expect(criar).toHaveBeenCalledTimes(1));
    const arvore = criar.mock.calls[0]![0] as { children: { children: unknown[] }[] };
    expect(arvore.children).toHaveLength(2);
    const botao = wrapper!.find('button.mapa-visual__todos');
    expect(botao.text()).toBe('Abrir todos os ramos');
    expect(botao.attributes('aria-expanded')).toBe('false');
    await botao.trigger('click');
    await vi.waitFor(() => expect(botao.text()).toBe('Recolher todos os ramos'));
    expect(botao.attributes('aria-expanded')).toBe('true');
    await botao.trigger('click');
    await vi.waitFor(() => expect(botao.text()).toBe('Abrir todos os ramos'));
    expect(wrapper!.find('button.mapa-visual__centralizar').text()).toBe('Centralizar');
  });

  it('no modo adaptado o markmap só é criado quando o leitor pede o mapa visual', async () => {
    criar.mockClear();
    montar(true);
    await Promise.resolve();
    expect(criar).not.toHaveBeenCalled();
  });

  it('o botão alterna para a lista (árvore acessível) e de volta, trocando o rótulo na hora', async () => {
    montar();
    await wrapper!.find('button.mapa-mental__modo').trigger('click');
    expect(wrapper!.find('[role="tree"]').exists()).toBe(true);
    expect(wrapper!.find('.mapa-visual').exists()).toBe(false);
    expect(wrapper!.find('button.mapa-mental__modo').text()).toBe('Ver mapa visual');
    await wrapper!.find('button.mapa-mental__modo').trigger('click');
    expect(wrapper!.find('.mapa-visual').exists()).toBe(true);
  });

  it('no modo adaptado abre direto a lista, e o mapa visual fica opcional', async () => {
    montar(true);
    expect(wrapper!.find('[role="tree"]').exists()).toBe(true);
    expect(wrapper!.find('.mapa-visual').exists()).toBe(false);
    await wrapper!.find('button.mapa-mental__modo').trigger('click');
    expect(wrapper!.find('.mapa-visual').exists()).toBe(true);
  });

  it('o botão do modo informa o que controla', () => {
    montar();
    expect(wrapper!.find('button.mapa-mental__modo').attributes('aria-controls')).toBeTruthy();
  });

  it('aponta para o Fichamento como versão em texto corrido', () => {
    montar();
    expect(wrapper!.find('a[href="/p/p1/c/u1/fichamento"]').exists()).toBe(true);
  });
});
