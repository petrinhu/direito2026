// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import MapaJuri from '@/ui/area-juri/MapaJuri.vue';
import { conteudoJuriValidadoFalso } from '../../unidade/apoio/conteudoJuriFalso';

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-modo-adaptado');
});

function montar(): VueWrapper {
  w = mount(MapaJuri, {
    props: { mapa: conteudoJuriValidadoFalso().mapa },
    attachTo: document.body
  });
  return w;
}

describe('MapaJuri', () => {
  it('com o modo adaptado ligado abre direto na lista, sem mapa visual', () => {
    document.documentElement.setAttribute('data-modo-adaptado', 'on');
    const mapa = montar();
    expect(mapa.find('.mapa-visual').exists()).toBe(false);
    expect(mapa.text()).toContain('Raiz fictícia');
    expect(mapa.text()).toContain('Folha um');
    expect(mapa.get('button[aria-controls="mapa-juri-conteudo"]').text()).toBe('Ver mapa visual');
  });

  it('o botão alterna entre a lista e o mapa visual', async () => {
    document.documentElement.setAttribute('data-modo-adaptado', 'on');
    const mapa = montar();
    await mapa.get('button[aria-controls="mapa-juri-conteudo"]').trigger('click');
    expect(mapa.get('button[aria-controls="mapa-juri-conteudo"]').text()).toBe('Ver em lista');
  });
});
