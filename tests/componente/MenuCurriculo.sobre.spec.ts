// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * SB-F9: link "Sobre" no menu, logo abaixo de Changelog, no mesmo bloco de Novidades e Changelog
 * (ordem do líder, 15/11/2026, item 107 do ratificar-13-11.md: "Sobre" fica abaixo de Changelog).
 */
function curriculoMinimo(): Curriculo {
  return [{ id: 'p1', numero: 1, rotulo: '1º período', cadeiras: [] }];
}

function montar(caminhoAtual: string) {
  return mount(MenuCurriculo, {
    props: { curriculo: curriculoMinimo(), caminhoAtual, usuario: '', admin: false }
  });
}

describe('MenuCurriculo, link Sobre no bloco Novidades/Changelog', () => {
  it('o bloco traz Novidades, Changelog e Sobre, nessa ordem', () => {
    const w = montar('');
    const bloco = w.findAll('ul.menu-curriculo__historico-lista a').map((a) => a.text().trim());
    expect(bloco).toEqual(['Novidades', 'Changelog', 'Sobre']);
  });

  it('o link Sobre aponta para /sobre e leva a classe do bloco', () => {
    const w = montar('');
    const link = w.find('a[href="/sobre"]');
    expect(link.exists()).toBe(true);
    expect(link.text().trim()).toBe('Sobre');
    expect(link.classes()).toContain('menu-curriculo__historico');
  });

  it('aria-current="page" só aparece no link Sobre quando a rota atual é sobre', () => {
    const naPagina = montar('sobre');
    expect(naPagina.find('a[href="/sobre"]').attributes('aria-current')).toBe('page');
    expect(naPagina.find('a[href="/changelog"]').attributes('aria-current')).toBeUndefined();

    const emOutra = montar('changelog');
    expect(emOutra.find('a[href="/sobre"]').attributes('aria-current')).toBeUndefined();
  });
});
