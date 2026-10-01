// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import MapaMentalVisor from '@/ui/componentes/MapaMentalVisor.vue';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import { ref } from 'vue';
import { DADOS_SINTETICOS } from '../unidade/apoio/dadosFichamento';

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
