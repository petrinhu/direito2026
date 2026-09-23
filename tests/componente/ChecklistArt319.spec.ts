// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ChecklistArt319 from '@/ui/componentes/ChecklistArt319.vue';

/**
 * Extra (a) da unidade de Redação Jurídica 1: checklist marcável dos 8
 * itens do art. 319 do CPC, tirados literalmente do guia de estudo (fonte:
 * peticao-inicial.pdf, seção "01 — antes de começar", contador "0 de 8").
 * O componente é controlado: recebe `marcados` de fora e só emite
 * `alternar`, nunca decide sozinho o que persiste (Unidade.vue decide,
 * via o mesmo RepositorioProgresso do site).
 */
describe('ChecklistArt319', () => {
  it('renderiza os 8 itens do art. 319 como checkbox', () => {
    const wrapper = mount(ChecklistArt319, { props: { marcados: [] } });
    const caixas = wrapper.findAll('input[type="checkbox"]');
    expect(caixas).toHaveLength(8);
  });

  it('mostra o contador "0 de 8" quando nada está marcado', () => {
    const wrapper = mount(ChecklistArt319, { props: { marcados: [] } });
    expect(wrapper.text()).toContain('0 de 8');
  });

  it('mostra o contador refletindo os itens marcados recebidos por prop', () => {
    const wrapper = mount(ChecklistArt319, {
      props: { marcados: ['cpc-319-item-i', 'cpc-319-item-ii'] }
    });
    expect(wrapper.text()).toContain('2 de 8');
    const caixas = wrapper.findAll<HTMLInputElement>('input[type="checkbox"]');
    expect(caixas[0]!.element.checked).toBe(true);
    expect(caixas[1]!.element.checked).toBe(true);
    expect(caixas[2]!.element.checked).toBe(false);
  });

  it('marcar um item ainda não marcado emite "alternar" com o id do item', async () => {
    const wrapper = mount(ChecklistArt319, { props: { marcados: [] } });
    const caixas = wrapper.findAll('input[type="checkbox"]');
    await caixas[0]!.setValue(true);
    expect(wrapper.emitted('alternar')).toBeTruthy();
    expect(wrapper.emitted('alternar')![0]).toEqual(['cpc-319-item-i']);
  });

  it('cada item tem um rótulo de texto associado (acessível por leitor de tela)', () => {
    const wrapper = mount(ChecklistArt319, { props: { marcados: [] } });
    expect(wrapper.text()).toContain('O juízo ao qual é dirigida');
    expect(wrapper.text()).toContain('Interesse em audiência de conciliação ou mediação');
  });
});
