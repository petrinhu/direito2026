// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * HIST-F3 (ordem do líder de 14/11, item 62): dois links no menu lateral: "Novidades" (didático) e
 * "Changelog" (técnico). Desde a ordem de 15/11 (item 104) eles têm bloco próprio, depois dos períodos e
 * antes da conta. Na rota atual, o link recebe aria-current.
 */
const curriculo: Curriculo = [{ id: 'p1', numero: 1, rotulo: '1º período', cadeiras: [] }];

describe('MenuCurriculo: Novidades e Changelog', () => {
  it('os dois links apontam para as páginas, em bloco próprio depois dos períodos (ordem de 15/11)', () => {
    const w = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    const topo = w.find('.menu-curriculo__topo');
    expect(topo.findAll('a').map((a) => a.text())).toEqual(['Calendário']);
    const bloco = w.find('.menu-curriculo__historico-lista');
    expect(bloco.findAll('a').map((a) => a.text())).toEqual(['Novidades', 'Changelog']);
    expect(bloco.find('a[href="/novidades"]').exists()).toBe(true);
    expect(bloco.find('a[href="/changelog"]').exists()).toBe(true);
    const periodos = w.find('.menu-curriculo__nivel-1').element;
    // DOCUMENT_POSITION_FOLLOWING (4): o bloco de Novidades vem depois da lista de períodos.
    expect(periodos.compareDocumentPosition(bloco.element) & 4).toBeTruthy();
  });

  it('o link da página atual recebe aria-current="page"', () => {
    const w = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: 'novidades' } });
    expect(w.find('a[href="/novidades"]').attributes('aria-current')).toBe('page');
    expect(w.find('a[href="/changelog"]').attributes('aria-current')).toBeUndefined();
  });
  it('na rota /changelog, o link do Changelog recebe aria-current="page" e o de Novidades não', () => {
    const w = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: 'changelog' } });
    expect(w.find('a[href="/changelog"]').attributes('aria-current')).toBe('page');
    expect(w.find('a[href="/novidades"]').attributes('aria-current')).toBeUndefined();
  });
});
