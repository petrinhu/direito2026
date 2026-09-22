// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BarraTopo from '@/ui/layout/BarraTopo.vue';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Ordem do líder, 22/09/2026: cabeçalho recolhe ao rolar para baixo e
 * volta ao rolar para cima; quem prefere menos movimento recebe o
 * cabeçalho fixo, sem recolher; e um item que acabou de receber foco por
 * teclado nunca fica escondido atrás do cabeçalho recolhido.
 */
function curriculoVazio(): Curriculo {
  return [];
}

function montarProps() {
  const repo = new RepositorioMemoria();
  return {
    curriculo: curriculoVazio(),
    caminhoAtual: '',
    storeTema: criarStoreTema(repo),
    storeBusca: criarStoreBusca()
  };
}

function definirScrollY(valor: number): void {
  Object.defineProperty(window, 'scrollY', { value: valor, configurable: true, writable: true });
}

function dispararScroll(): void {
  window.dispatchEvent(new Event('scroll'));
}

describe('BarraTopo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    definirScrollY(0);
  });

  it('rolando para baixo além do limiar, o cabeçalho ganha a classe de oculto', async () => {
    const wrapper = mount(BarraTopo, { props: montarProps() });
    definirScrollY(0);
    dispararScroll();
    await wrapper.vm.$nextTick();

    definirScrollY(200);
    dispararScroll();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('header').classes()).toContain('barra-topo--oculta');
  });

  it('rolando de volta para cima, o cabeçalho perde a classe de oculto', async () => {
    const wrapper = mount(BarraTopo, { props: montarProps() });
    definirScrollY(0);
    dispararScroll();
    definirScrollY(200);
    dispararScroll();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('header').classes()).toContain('barra-topo--oculta');

    definirScrollY(150);
    dispararScroll();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('header').classes()).not.toContain('barra-topo--oculta');
  });

  it('com prefers-reduced-motion, nunca ganha a classe de oculto, mesmo rolando bastante para baixo', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {}
    }));
    const wrapper = mount(BarraTopo, { props: montarProps() });

    definirScrollY(0);
    dispararScroll();
    definirScrollY(400);
    dispararScroll();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('header').classes()).not.toContain('barra-topo--oculta');
    expect(wrapper.find('header').classes()).toContain('barra-topo--fixa');
  });

  it('foco entrando num item do cabeçalho traz o cabeçalho de volta, mesmo oculto', async () => {
    const wrapper = mount(BarraTopo, { props: montarProps(), attachTo: document.body });
    definirScrollY(0);
    dispararScroll();
    definirScrollY(300);
    dispararScroll();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('header').classes()).toContain('barra-topo--oculta');

    const botaoGaveta = wrapper.find('.barra-topo__botao-gaveta');
    (botaoGaveta.element as HTMLElement).focus();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('header').classes()).not.toContain('barra-topo--oculta');
    wrapper.unmount();
  });

  it('emite abrir-gaveta ao clicar no botão da gaveta', async () => {
    const wrapper = mount(BarraTopo, { props: montarProps() });
    await wrapper.find('.barra-topo__botao-gaveta').trigger('click');
    expect(wrapper.emitted('abrir-gaveta')).toBeTruthy();
  });

  it('mostra a trilha de navegação (rótulo próprio de navegação)', () => {
    const wrapper = mount(BarraTopo, { props: montarProps() });
    expect(wrapper.find('nav[aria-label="Trilha de navegação"]').exists()).toBe(true);
  });
});
