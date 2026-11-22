// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Grupo "Game" no menu lateral (ordem do líder, 21/11/2026): abre pela seta, como os grupos de
 * cadeira. Dentro: "Kelsen Jump" (link para a rota do jogo) e "aguarde" (item desabilitado, sem destino).
 */
function curriculoMinimo(): Curriculo {
  return [{ id: 'p1', numero: 1, rotulo: '1º período', cadeiras: [] }];
}

function montar(caminhoAtual: string) {
  return mount(MenuCurriculo, {
    props: { curriculo: curriculoMinimo(), caminhoAtual, usuario: '', admin: false },
    attachTo: document.body
  });
}

describe('MenuCurriculo, grupo Game', () => {
  it('o botão do grupo Game existe, começa fechado e controla a lista dos itens', () => {
    const w = montar('');
    const botao = w.find('button[aria-controls="lista-game"]');
    expect(botao.exists()).toBe(true);
    expect(botao.text()).toContain('Game');
    expect(botao.attributes('aria-expanded')).toBe('false');
    w.unmount();
  });

  it('clicar no botão abre e fecha o grupo, como os grupos de cadeira', async () => {
    const w = montar('');
    const botao = w.find('button[aria-controls="lista-game"]');
    await botao.trigger('click');
    expect(botao.attributes('aria-expanded')).toBe('true');
    await botao.trigger('click');
    expect(botao.attributes('aria-expanded')).toBe('false');
    w.unmount();
  });

  it('dentro do grupo, "Kelsen Jump" é link para /kelsen-jump', () => {
    const w = montar('');
    const link = w.find('a[href="/kelsen-jump"]');
    expect(link.exists()).toBe(true);
    expect(link.text().trim()).toBe('Kelsen Jump');
    w.unmount();
  });

  it('o segundo item é "aguarde", desabilitado, sem link', () => {
    const w = montar('');
    const lista = w.find('#lista-game');
    const aguarde = lista.findAll('[aria-disabled="true"]');
    expect(aguarde).toHaveLength(1);
    expect(aguarde[0]!.text().trim()).toBe('aguarde');
    expect(aguarde[0]!.element.tagName).not.toBe('A');
    expect(lista.find('a:not([href="/kelsen-jump"])').exists()).toBe(false);
    w.unmount();
  });

  it('o grupo abre sozinho quando a página atual é o jogo', () => {
    const w = montar('kelsen-jump');
    const botao = w.find('button[aria-controls="lista-game"]');
    expect(botao.attributes('aria-expanded')).toBe('true');
    expect(w.find('a[href="/kelsen-jump"]').attributes('aria-current')).toBe('page');
    w.unmount();
  });
});
