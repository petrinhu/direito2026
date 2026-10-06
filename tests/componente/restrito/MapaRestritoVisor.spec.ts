// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import MapaRestritoVisor from '@/ui/area-restrita/MapaRestritoVisor.vue';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';

vi.mock('markmap-view', () => ({
  Markmap: {
    create: () => ({
      state: {},
      toggleNode: async () => {},
      setData: async () => {},
      renderData: async () => {},
      setOptions: () => {},
      destroy: () => {}
    })
  }
}));

const mapa = { rotulo: 'Tema', filhos: [{ rotulo: 'Ramo A' }, { rotulo: 'Ramo B' }] };

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

function montar(reduzir: boolean, adaptadoLigado: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reduzir, addEventListener: () => {}, removeEventListener: () => {} }))
  );
  w = mount(MapaRestritoVisor, {
    props: { mapa },
    attachTo: document.body,
    global: {
      provide: {
        [CHAVE_STORE_MODO_ADAPTADO as unknown as symbol]: {
          ativo: ref(adaptadoLigado),
          suspenso: ref(true),
          efetivo: ref(false),
          alternar() {},
          suspender() {}
        }
      }
    }
  });
  return w;
}

const textoDoBotao = () => w!.get('button.ar-botao').text();

describe('MapaRestritoVisor', () => {
  it('com o modo adaptado ligado no resto do site, abre no mapa visual como sempre', () => {
    montar(false, true);
    expect(textoDoBotao()).toBe('Ver em lista');
  });

  it('com prefers-reduced-motion, abre direto na lista acessível', () => {
    montar(true, false);
    expect(textoDoBotao()).toBe('Ver mapa visual');
  });

  it('o botão alterna entre mapa e lista', async () => {
    montar(false, false);
    await w!.get('button.ar-botao').trigger('click');
    expect(textoDoBotao()).toBe('Ver mapa visual');
  });
});
