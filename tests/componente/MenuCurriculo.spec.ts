// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

function curriculoDeTeste(): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1o período',
      cadeiras: [
        {
          id: 'intr-direito',
          nome: 'Introdução ao Direito',
          estado: 'publicado',
          unidades: [
            {
              id: 'u1',
              rotulo: 'Unidade 1',
              titulo: 'Unidade 1',
              estado: 'publicado',
              abas: ['resumo']
            },
            {
              id: 'u2',
              rotulo: 'Unidade 2',
              titulo: 'Unidade 2',
              estado: 'em-breve',
              abas: []
            }
          ]
        }
      ]
    }
  ];
}

describe('MenuCurriculo', () => {
  it('contêiner é <nav aria-label="Currículo">, único no documento', () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: '' }
    });
    const nav = wrapper.find('nav[aria-label="Currículo"]');
    expect(nav.exists()).toBe(true);
  });

  it('nível de período começa fechado (aria-expanded=false) e expande ao clicar', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: '' }
    });
    const botaoPeriodo = wrapper.find('button[aria-expanded]');
    expect(botaoPeriodo.attributes('aria-expanded')).toBe('false');
    await botaoPeriodo.trigger('click');
    expect(botaoPeriodo.attributes('aria-expanded')).toBe('true');
  });

  it('Escape fecha o nível aberto e devolve o foco ao botão que o abriu', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: '' },
      attachTo: document.body
    });
    const botaoPeriodo = wrapper.find('button[aria-expanded]');
    await botaoPeriodo.trigger('click');
    expect(botaoPeriodo.attributes('aria-expanded')).toBe('true');

    await botaoPeriodo.trigger('keydown', { key: 'Escape' });
    expect(botaoPeriodo.attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(botaoPeriodo.element);
    wrapper.unmount();
  });

  it('item em-breve não é link focável: é span aria-disabled com "em breve" no nome', () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: '' }
    });
    expect(wrapper.text().toLowerCase()).toContain('em breve');
    const linksEmBreve = wrapper.findAll('a').filter((a) => a.text().includes('Unidade 2'));
    expect(linksEmBreve).toHaveLength(0);
  });

  it('unidade publicada é um link real (<a>) com href', () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: '' }
    });
    const link = wrapper.findAll('a').find((a) => a.text().includes('Unidade 1'));
    expect(link).toBeTruthy();
    expect(link!.attributes('href')).toContain('/p/p1/intr-direito/u1');
  });
});
