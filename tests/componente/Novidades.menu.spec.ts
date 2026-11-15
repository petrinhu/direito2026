// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * HIST-F3 (ordem do líder de 14/11, item 62): dois links no menu lateral, logo depois do Calendário:
 * "Novidades" (didático) e "Changelog" (técnico). Na rota atual, o link recebe aria-current.
 */
const curriculo: Curriculo = [{ id: 'p1', numero: 1, rotulo: '1º período', cadeiras: [] }];

describe('MenuCurriculo: Novidades e Changelog', () => {
  it('os dois links apontam para as páginas e vêm depois do Calendário, no mesmo topo', () => {
    const w = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    const topo = w.find('.menu-curriculo__topo');
    const textos = topo.findAll('a').map((a) => a.text());
    expect(textos).toEqual(['Calendário', 'Novidades', 'Changelog']);
    expect(topo.find('a[href="/novidades"]').exists()).toBe(true);
    expect(topo.find('a[href="/changelog"]').exists()).toBe(true);
  });

  it('o link da página atual recebe aria-current="page"', () => {
    const w = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: 'novidades' } });
    expect(w.find('a[href="/novidades"]').attributes('aria-current')).toBe('page');
    expect(w.find('a[href="/changelog"]').attributes('aria-current')).toBeUndefined();
  });
});
