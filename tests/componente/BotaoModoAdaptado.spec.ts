// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BotaoModoAdaptado from '@/ui/componentes/BotaoModoAdaptado.vue';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';

describe('BotaoModoAdaptado', () => {
  it('estado inicial: aria-pressed="false" e rótulo "Leitura ampliada"; após clicar, aria-pressed="true" e rótulo "Leitura normal"', async () => {
    const store = criarStoreModoAdaptado(new RepositorioMemoria());
    const wrapper = mount(BotaoModoAdaptado, { props: { store } });

    const botao = wrapper.find('button');
    expect(botao.attributes('aria-pressed')).toBe('false');
    expect(wrapper.text()).toContain('Leitura ampliada');

    await botao.trigger('click');

    expect(botao.attributes('aria-pressed')).toBe('true');
    expect(wrapper.text()).toContain('Leitura normal');
  });
});
