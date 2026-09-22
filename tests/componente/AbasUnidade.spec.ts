// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AbasUnidade from '@/ui/componentes/AbasUnidade.vue';
import type { ChaveAba } from '@/core/curriculo/tipos';

describe('AbasUnidade', () => {
  const abas: readonly ChaveAba[] = ['resumo', 'peticao', 'quiz'];

  it('renderiza role=tablist e um tab por aba disponível', () => {
    const wrapper = mount(AbasUnidade, { props: { abas, abaAtiva: 'resumo' } });
    expect(wrapper.attributes('role')).toBeUndefined(); // o componente raiz não é o tablist necessariamente
    const tablist = wrapper.find('[role="tablist"]');
    expect(tablist.exists()).toBe(true);
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs).toHaveLength(3);
  });

  it('aba ausente na lista de abas não é renderizada', () => {
    const wrapper = mount(AbasUnidade, { props: { abas: ['resumo'], abaAtiva: 'resumo' } });
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs).toHaveLength(1);
  });

  it('clicar numa aba emite "navegar" com a chave da aba, sem trocar estado local sozinho', async () => {
    const wrapper = mount(AbasUnidade, { props: { abas, abaAtiva: 'resumo' } });
    const tabs = wrapper.findAll('[role="tab"]');
    await tabs[2]!.trigger('click');
    expect(wrapper.emitted('navegar')).toEqual([['quiz']]);
  });

  it('a aba ativa tem aria-selected=true e aria-controls aponta pro painel', () => {
    const wrapper = mount(AbasUnidade, { props: { abas, abaAtiva: 'peticao' } });
    const ativa = wrapper.find('[role="tab"][aria-selected="true"]');
    expect(ativa.exists()).toBe(true);
    expect(ativa.text().toLowerCase()).toContain('peti');
    expect(ativa.attributes('aria-controls')).toBeTruthy();
  });
});
