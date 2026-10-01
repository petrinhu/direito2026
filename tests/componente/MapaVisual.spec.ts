// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import MapaVisual from '@/ui/componentes/MapaVisual.vue';
import { arvoreVisual } from '@/core/fichamento/mapaVisual';
import { DADOS_SINTETICOS } from '../unidade/apoio/dadosFichamento';

let wrapper: VueWrapper | undefined;
const arvore = arvoreVisual(DADOS_SINTETICOS);

function montar() {
  wrapper = mount(MapaVisual, {
    props: { arvore, baseUnidade: '/p/p1/c/u1', reduzirMovimento: true },
    attachTo: document.body
  });
  return wrapper;
}
const nos = () => wrapper!.findAll('.mapa-visual__no');
const no = (id: string) => wrapper!.find(`[data-no="${id}"]`);
const escala = () =>
  Number(
    /scale\(([\d.]+)\)/.exec(wrapper!.find('.mapa-visual__mundo').attributes('transform')!)![1]
  );
const botao = (nome: RegExp) =>
  wrapper!.findAll('button').find((b) => nome.test(b.text() + (b.attributes('aria-label') ?? '')))!;

afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = '';
});

describe('MapaVisual', () => {
  it('começa com o nó central, os períodos e os pensadores', () => {
    montar();
    expect(nos().map((n) => n.attributes('data-no'))).toEqual(
      expect.arrayContaining([
        'mapa-raiz',
        'mapa-era-antiga',
        'mapa-era-media',
        'mapa-pensador-alfa'
      ])
    );
    expect(nos()).toHaveLength(6);
    expect(no('mapa-alfa-modo').exists()).toBe(false);
  });

  it('cada nó é um botão com nome e estado, e as cápsulas mostram o texto', () => {
    montar();
    const alfa = no('mapa-pensador-alfa');
    expect(alfa.attributes('role')).toBe('button');
    expect(alfa.attributes('tabindex')).toBe('0');
    expect(alfa.attributes('aria-expanded')).toBe('false');
    expect(alfa.attributes('aria-label')).toContain('Alfa');
    expect(alfa.find('text').text()).toBe('Alfa (1-2)');
    expect(alfa.find('rect').attributes('rx')).toBeTruthy();
  });

  it('clicar abre o ramo (aparecem os filhos) e clicar de novo fecha', async () => {
    montar();
    await no('mapa-pensador-alfa').trigger('click');
    expect(no('mapa-alfa-modo').exists()).toBe(true);
    expect(no('mapa-pensador-alfa').attributes('aria-expanded')).toBe('true');
    await no('mapa-pensador-alfa').trigger('click');
    expect(no('mapa-alfa-modo').exists()).toBe(false);
  });

  it('Enter e Espaço abrem o ramo pelo teclado', async () => {
    montar();
    await no('mapa-pensador-beta').trigger('keydown', { key: 'Enter' });
    expect(no('mapa-pensador-beta').attributes('aria-expanded')).toBe('true');
    await no('mapa-pensador-beta').trigger('keydown', { key: ' ' });
    expect(no('mapa-pensador-beta').attributes('aria-expanded')).toBe('false');
  });

  it('o detalhe abre ao clicar: painel com o modo de pensar e o link da ficha', async () => {
    montar();
    await no('mapa-pensador-alfa').trigger('click');
    const painel = wrapper!.find('.mapa-visual__detalhe');
    expect(painel.text()).toContain('Alfa');
    expect(painel.text()).toContain('Pensa em açúcar.');
    expect(painel.find('a[href="/p/p1/c/u1/fichamento#ficha-alfa"]').exists()).toBe(true);
    expect(painel.attributes('aria-live')).toBe('polite');
  });

  it('um único botão alterna todos os ramos: o rótulo e o estado mudam na hora', async () => {
    montar();
    const alternar = () => wrapper!.find('button.mapa-visual__todos');
    expect(alternar().text()).toBe('Abrir todos os ramos');
    expect(alternar().attributes('aria-expanded')).toBe('false');
    await alternar().trigger('click');
    expect(alternar().text()).toBe('Recolher os ramos');
    expect(alternar().attributes('aria-expanded')).toBe('true');
    expect(no('mapa-alfa-conceito-0').exists()).toBe(true);
    await alternar().trigger('click');
    expect(alternar().text()).toBe('Abrir todos os ramos');
    expect(no('mapa-alfa-modo').exists()).toBe(false);
  });

  it('abrir um ramo à mão que completa tudo também troca o rótulo do botão', async () => {
    montar();
    await wrapper!.find('button.mapa-visual__todos').trigger('click');
    await no('mapa-pensador-alfa').trigger('click');
    expect(wrapper!.find('button.mapa-visual__todos').text()).toBe('Abrir todos os ramos');
  });

  it('+ e − mudam o zoom, e Centralizar volta ao enquadramento inicial', async () => {
    montar();
    await wrapper!.vm.$nextTick();
    const inicial = escala();
    await botao(/Aproximar/).trigger('click');
    expect(escala()).toBeGreaterThan(inicial);
    await botao(/Afastar/).trigger('click');
    await botao(/Afastar/).trigger('click');
    expect(escala()).toBeLessThan(inicial);
    await botao(/Centralizar/).trigger('click');
    expect(escala()).toBeCloseTo(inicial, 5);
  });

  it('o zoom tem piso e teto', async () => {
    montar();
    for (let i = 0; i < 30; i++) await botao(/Aproximar/).trigger('click');
    expect(escala()).toBeLessThanOrEqual(3);
    for (let i = 0; i < 60; i++) await botao(/Afastar/).trigger('click');
    expect(escala()).toBeGreaterThanOrEqual(0.3);
  });

  it('a roda do mouse aproxima', async () => {
    montar();
    await wrapper!.vm.$nextTick();
    const inicial = escala();
    await wrapper!.find('svg').trigger('wheel', { deltaY: -100 });
    expect(escala()).toBeGreaterThan(inicial);
  });

  it('as ligações são curvas coloridas por ramo, uma por nó que tem pai', () => {
    montar();
    const curvas = wrapper!.findAll('path.mapa-visual__ligacao');
    expect(curvas).toHaveLength(nos().length - 1);
    expect(curvas[0]!.attributes('d')).toMatch(/^M .* C /);
    expect(curvas[0]!.attributes('style')).toContain('--cor-mapa-ramo-');
  });

  it('instrui o uso: arrastar, zoom e a lista como alternativa', () => {
    montar();
    expect(wrapper!.text()).toContain('Arraste');
  });
});
