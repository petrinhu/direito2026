// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Rodape from '@/ui/layout/Rodape.vue';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';

/**
 * Ordem do líder, 22/09/2026, verbatim: "ponha discretamente no rodapé
 * que o caderno de direito é oferecimento de [logo]-[link drpetrus.top].".
 * O link de apagar dados, a mesma data, é testado aqui só para existir.
 *
 * A linha de direitos segue a decisão de 20/10/2026 (substitui a ordem de
 * 22/09/2026 sobre o copyright): "v{versão} · © 2026 Caderno de Direito",
 * e a partir de 2027 "© 2026-2027". A versão vem do package.json (campo
 * version), nunca escrita à mão: o líder troca 0.1.0 por 1.0.0.0 no dia da
 * tag, e este teste não pode quebrar por isso.
 */
const pacote = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')) as {
  version: string;
};

function montarProps() {
  return { repositorio: new RepositorioMemoria() };
}

describe('Rodape', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('a versão injetada no build é a do package.json (prova o define do Vite e do Vitest)', () => {
    expect(__VERSAO_SITE__).toBe(pacote.version);
  });

  it('em 2026, a linha de direitos mostra a versão e um ano só', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
    const wrapper = mount(Rodape, { props: montarProps() });
    expect(wrapper.text()).toContain(`v${pacote.version} · © 2026 Caderno de Direito`);
  });

  it('em 2030, a faixa de anos vem da data, não está escrita à mão', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2030-01-05T12:00:00Z'));
    const wrapper = mount(Rodape, { props: montarProps() });
    expect(wrapper.text()).toContain(`v${pacote.version} · © 2026-2030 Caderno de Direito`);
    expect(wrapper.text()).not.toContain('2026 Caderno de Direito');
  });

  it('mostra a linha de oferecimento com logo e link para drpetrus.top, abrindo em nova aba com noopener', () => {
    const wrapper = mount(Rodape, { props: montarProps() });
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
    const wrapper = mount(Rodape, { props: montarProps() });
    const texto = wrapper.text();
    expect(texto.indexOf('oferecimento')).toBeLessThan(texto.indexOf('©'));
  });

  it('a linha de direitos não contém travessão longo nem meia-risca', () => {
    const wrapper = mount(Rodape, { props: montarProps() });
    expect(wrapper.find('.rodape__direitos').text()).not.toMatch(/[–—]/);
  });

  it('tem um link para apagar os dados guardados, que confirma antes de limpar', async () => {
    vi.stubGlobal('confirm', () => true);
    vi.stubGlobal('location', { ...window.location, reload: vi.fn() });

    const repositorio = new RepositorioMemoria();
    repositorio.salvarTema('escuro');
    const wrapper = mount(Rodape, { props: { repositorio } });

    const botaoApagar = wrapper.find('.rodape__apagar');
    expect(botaoApagar.exists()).toBe(true);
    await botaoApagar.trigger('click');

    expect(repositorio.lerTema()).toBeUndefined();
  });
});
