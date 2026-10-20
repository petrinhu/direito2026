// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Ordem do líder (20/10/2026): link "Calendário" no topo da barra lateral,
 * acima do 1º período, com ícone SVG simples e aria-current na rota.
 */
function curriculoMinimo(): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
      cadeiras: []
    }
  ];
}

describe('MenuCurriculo, link Calendário no topo', () => {
  it('o link aponta para /calendario e aparece antes do primeiro período', () => {
    const w = mount(MenuCurriculo, {
      props: { curriculo: curriculoMinimo(), caminhoAtual: '' }
    });
    const links = w.findAll('a[href="/calendario"]');
    expect(links).toHaveLength(1);
    expect(links[0]?.text()).toBe('Calendário');

    const ordem = w.findAll('nav a, nav button').map((el) => el.element);
    expect(ordem.indexOf(links[0]!.element)).toBe(0);
  });

  it('traz um ícone SVG decorativo, escondido do leitor de tela', () => {
    const w = mount(MenuCurriculo, {
      props: { curriculo: curriculoMinimo(), caminhoAtual: '' }
    });
    const svg = w.find('a[href="/calendario"] svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('aria-hidden')).toBe('true');
  });

  it('na rota do calendário, o link recebe aria-current="page"', () => {
    const w = mount(MenuCurriculo, {
      props: { curriculo: curriculoMinimo(), caminhoAtual: 'calendario' }
    });
    expect(w.find('a[href="/calendario"]').attributes('aria-current')).toBe('page');
  });

  it('fora da rota, o link não tem aria-current', () => {
    const w = mount(MenuCurriculo, {
      props: { curriculo: curriculoMinimo(), caminhoAtual: '' }
    });
    expect(w.find('a[href="/calendario"]').attributes('aria-current')).toBeUndefined();
  });
});
