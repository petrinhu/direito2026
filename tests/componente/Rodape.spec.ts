// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Rodape from '@/ui/layout/Rodape.vue';

/**
 * Ordem do líder, 22/09/2026, verbatim: "ponha discretamente no rodapé
 * que o caderno de direito é oferecimento de [logo]-[link drpetrus.top].
 * Ponha ainda no rodapé copyright [símbolo copyright] [travessão] [2026
 * [travessão] ano_atual_dinamico]". O segundo ano tem de vir da data do
 * navegador, nunca escrito à mão: os dois primeiros testes provam isso
 * congelando o relógio em anos diferentes.
 */
describe('Rodape', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('em 2026, a linha de direitos mostra Copyright © — 2026—2026', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    const wrapper = mount(Rodape);
    expect(wrapper.text()).toContain('Copyright © — 2026—2026');
  });

  it('em 2030, o segundo ano da linha de direitos vira 2030 (vem da data, não está escrito à mão)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-05T12:00:00Z'));
    const wrapper = mount(Rodape);
    expect(wrapper.text()).toContain('Copyright © — 2026—2030');
    expect(wrapper.text()).not.toContain('2026—2026');
  });

  it('mostra a linha de oferecimento com logo e link para drpetrus.top, abrindo em nova aba com noopener', () => {
    const wrapper = mount(Rodape);
    const link = wrapper.find('a.rodape__link-oferecimento');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://drpetrus.top');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toContain('noopener');

    const img = wrapper.find('img.rodape__logo');
    expect(img.exists()).toBe(true);
    expect(img.attributes('width')).toBe('95');
    expect(img.attributes('height')).toBe('53');

    expect(wrapper.text()).toContain('drpetrus.top');
    expect(wrapper.text().toLowerCase()).toContain('oferecimento');
  });

  it('a linha de oferecimento vem antes da linha de direitos', () => {
    const wrapper = mount(Rodape);
    const texto = wrapper.text();
    expect(texto.indexOf('oferecimento')).toBeLessThan(texto.indexOf('Copyright'));
  });
});
