// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import QuadroResumo from '@/ui/componentes/QuadroResumo.vue';

/**
 * Bloco sem itens de resumo (ex.: placeholder "Aguardando material do
 * professor.", resumo: []) não pode mostrar uma caixa "Quadro-resumo" vazia.
 */
describe('QuadroResumo, lista de itens', () => {
  it('com lista vazia não renderiza a caixa Quadro-resumo', () => {
    const wrapper = mount(QuadroResumo, { props: { itens: [] } });
    expect(wrapper.find('.quadro-resumo').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Quadro-resumo');
  });

  it('com itens renderiza a caixa e um li por item', () => {
    const wrapper = mount(QuadroResumo, { props: { itens: ['primeiro', 'segundo'] } });
    expect(wrapper.find('.quadro-resumo').exists()).toBe(true);
    expect(wrapper.findAll('li')).toHaveLength(2);
  });
});
