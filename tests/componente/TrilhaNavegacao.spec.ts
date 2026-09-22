// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TrilhaNavegacao from '@/ui/componentes/TrilhaNavegacao.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Ordem do líder, 22/09/2026, verbatim: "Faixa sólida com TRILHA de
 * navegação à esquerda: período, cadeira, unidade e seção atual, cada
 * parte clicável, levando ao nível correspondente." A trilha se monta a
 * partir do currículo, com resolverRota (a mesma função pura que já
 * resolve URL contra árvore em outro lugar do produto) — nada de rótulo
 * inventado.
 */
function curriculoDeTeste(): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
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
              abas: ['resumo', 'peticao', 'quiz']
            }
          ]
        }
      ]
    },
    { id: 'p2', numero: 2, rotulo: '2º período', cadeiras: [] }
  ];
}

describe('TrilhaNavegacao', () => {
  it('fora de uma página de unidade, mostra só o nome do produto, marcado como atual', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: '' }
    });
    const itens = wrapper.findAll('li');
    expect(itens).toHaveLength(1);
    expect(wrapper.text()).toContain('Caderno de Direito');
    expect(wrapper.find('a[aria-current="page"]').exists()).toBe(true);
  });

  it('em página de unidade, monta período > cadeira > unidade > aba, cada uma com link real', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: 'p/p1/intr-direito/u1' }
    });
    const links = wrapper.findAll('a');
    expect(links).toHaveLength(4);
    expect(links[0]!.text()).toBe('1º período');
    expect(links[0]!.attributes('href')).toBe('/p/p1');
    expect(links[1]!.text()).toBe('Introdução ao Direito');
    expect(links[1]!.attributes('href')).toBe('/p/p1/intr-direito');
    expect(links[2]!.text()).toBe('Unidade 1');
    expect(links[2]!.attributes('href')).toBe('/p/p1/intr-direito/u1');
    expect(links[3]!.text()).toBe('Resumo');
    expect(links[3]!.attributes('aria-current')).toBe('page');
  });

  it('na aba de petição, o último item da trilha é "Petição comentada"', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: 'p/p1/intr-direito/u1/peticao' }
    });
    const links = wrapper.findAll('a');
    expect(links[3]!.text()).toBe('Petição comentada');
    expect(links[3]!.attributes('href')).toBe('/p/p1/intr-direito/u1/peticao');
  });

  it('período sem cadeira (em breve) monta trilha parcial só com o que existe', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: 'p/p2' }
    });
    const links = wrapper.findAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]!.text()).toBe('2º período');
    expect(links[0]!.attributes('aria-current')).toBe('page');
  });

  it('nav tem rótulo acessível próprio e é uma lista ordenada', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: 'p/p1/intr-direito/u1' }
    });
    const nav = wrapper.find('nav');
    expect(nav.attributes('aria-label')).toBeTruthy();
    expect(nav.find('ol').exists()).toBe(true);
  });

  it('com mais de dois níveis, a lista fica marcada como truncável (CSS encolhe em tela estreita)', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: 'p/p1/intr-direito/u1' }
    });
    expect(wrapper.find('ol').attributes('data-truncavel')).toBe('true');
  });

  it('com um só nível, a lista não é marcada como truncável', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: '' }
    });
    expect(wrapper.find('ol').attributes('data-truncavel')).toBe('false');
  });
});
