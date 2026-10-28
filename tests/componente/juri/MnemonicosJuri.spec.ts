// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import MnemonicosJuri from '@/ui/area-juri/MnemonicosJuri.vue';
import { conteudoJuriValidadoFalso } from '../../unidade/apoio/conteudoJuriFalso';

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = '';
});

function montar(): VueWrapper {
  w = mount(MnemonicosJuri, {
    props: { mnemonicos: conteudoJuriValidadoFalso().mnemonicos },
    attachTo: document.body
  });
  return w;
}

describe('MnemonicosJuri', () => {
  it('mostra a dica e esconde a resposta até o botão revelar', async () => {
    const cartao = montar();
    expect(cartao.text()).toContain('Dica fictícia.');
    expect(cartao.text()).not.toContain('Resposta fictícia da dica.');

    await cartao.get('button[aria-expanded="false"]').trigger('click');
    expect(cartao.text()).toContain('Resposta fictícia da dica.');
    expect(cartao.find('button[aria-expanded="true"]').exists()).toBe(true);
  });

  it('"Esconder todas as respostas" recolhe as que estavam abertas', async () => {
    const cartao = montar();
    await cartao.get('button[aria-expanded="false"]').trigger('click');
    const esconder = cartao.findAll('button').find((b) => b.text().includes('Esconder todas'));
    await esconder!.trigger('click');
    expect(cartao.text()).not.toContain('Resposta fictícia da dica.');
  });

  it('mostra as fontes do cartão, discretas, abaixo da dica', () => {
    expect(montar().text()).toContain('Fonte fictícia do mnemônico');
  });
});
