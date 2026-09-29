// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BarraTopo from '@/ui/layout/BarraTopo.vue';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
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
    storeBusca: criarStoreBusca(),
    storeModoAdaptado: criarStoreModoAdaptado(repo)
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

  it('com o modo adaptado ligado, nunca ganha a classe de oculto, mesmo rolando bastante para baixo', async () => {
    const props = montarProps();
    props.storeModoAdaptado.alternar();
    const wrapper = mount(BarraTopo, { props });

    definirScrollY(0);
    dispararScroll();
    definirScrollY(400);
    dispararScroll();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('header').classes()).not.toContain('barra-topo--oculta');
    expect(wrapper.find('header').classes()).toContain('barra-topo--fixa');
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

/**
 * A altura que o resto da página reserva por baixo do cabeçalho fixo
 * (`--altura-cabecalho`, LayoutBase.vue e scroll-padding-top) vinha de um
 * número escrito à mão em tokens.css (64px, 220px no modo adaptado) que não
 * acompanhava o cabeçalho real quando ele quebra em 2 ou 3 linhas (IMPORTANTE
 * 1 e 2 de docs/qa-sociologia-u1.md: 433px reais contra 220px reservados).
 * Agora o cabeçalho publica a própria altura medida; quando não é fixo
 * (modo adaptado em tela estreita), não reserva nada.
 */
describe('BarraTopo, altura reservada para o conteúdo', () => {
  const alturaOriginal = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

  afterEach(() => {
    vi.restoreAllMocks();
    if (alturaOriginal)
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', alturaOriginal);
    document.documentElement.style.removeProperty('--altura-cabecalho');
  });

  function simularCabecalho(posicao: string, altura: number): void {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => altura
    });
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      position: posicao
    } as ReturnType<typeof window.getComputedStyle>);
  }

  it('cabeçalho fixo publica a altura medida em --altura-cabecalho', () => {
    simularCabecalho('fixed', 173);
    const wrapper = mount(BarraTopo, { props: montarProps() });
    expect(document.documentElement.style.getPropertyValue('--altura-cabecalho')).toBe('173px');
    wrapper.unmount();
  });

  it('cabeçalho fora do fluxo fixo não reserva altura nenhuma', () => {
    simularCabecalho('static', 433);
    const wrapper = mount(BarraTopo, { props: montarProps() });
    expect(document.documentElement.style.getPropertyValue('--altura-cabecalho')).toBe('0px');
    wrapper.unmount();
  });

  it('ao sair da página, devolve a variável ao valor dos tokens', () => {
    simularCabecalho('fixed', 173);
    const wrapper = mount(BarraTopo, { props: montarProps() });
    wrapper.unmount();
    expect(document.documentElement.style.getPropertyValue('--altura-cabecalho')).toBe('');
  });
});
