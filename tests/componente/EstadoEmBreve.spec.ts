// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import EstadoEmBreve from '@/ui/componentes/EstadoEmBreve.vue';

describe('EstadoEmBreve', () => {
  it('rende o rótulo e não emite nenhum evento de navegação', () => {
    const wrapper = mount(EstadoEmBreve, { props: { rotulo: 'Unidade 2' } });
    expect(wrapper.text()).toContain('Unidade 2');
    expect(wrapper.emitted()).toEqual({});
  });

  it('o nome acessível contém "em breve"', () => {
    const wrapper = mount(EstadoEmBreve, { props: { rotulo: 'Unidade 2' } });
    expect(wrapper.text().toLowerCase()).toContain('em breve');
  });

  it('não é <a> nem <button disabled>: é span com aria-disabled', () => {
    const wrapper = mount(EstadoEmBreve, { props: { rotulo: 'Unidade 2' } });
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('button[disabled]').exists()).toBe(false);
    const span = wrapper.find('span[aria-disabled="true"]');
    expect(span.exists()).toBe(true);
  });
});
