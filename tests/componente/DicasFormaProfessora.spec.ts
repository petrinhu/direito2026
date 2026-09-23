// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DicasFormaProfessora from '@/ui/componentes/DicasFormaProfessora.vue';

/**
 * Extra (c) da unidade de Redação Jurídica 1: dicas de forma anotadas pela
 * professora no quadro (WhatsApp Image 2026-09-10 at 21.18.17.jpeg): fatos
 * em até 10 linhas, e o limite total de 150 linhas para a peça inteira,
 * ambos lidos direto da foto (L-41), nunca inventados.
 */
describe('DicasFormaProfessora', () => {
  it('mostra o limite de dez linhas para a seção de fatos', () => {
    const wrapper = mount(DicasFormaProfessora);
    expect(wrapper.text()).toContain('dez linhas');
  });

  it('mostra o limite total de 150 linhas para a peça inteira', () => {
    const wrapper = mount(DicasFormaProfessora);
    expect(wrapper.text()).toContain('150 linhas');
  });
});
