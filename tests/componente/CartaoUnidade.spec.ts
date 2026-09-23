// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CartaoUnidade from '@/ui/componentes/CartaoUnidade.vue';
import type { Cadeira, Periodo, ReferenciaUnidade } from '@/core/curriculo/tipos';

/**
 * Pedido do líder, 23/09/2026, verbatim: "Lembre de linkar no menu da
 * pagina inicial e criar o card da pagina inicial". Achado do
 * orquestrador: com duas cadeiras publicadas no 1º período, os dois
 * cartões da home mostravam exatamente o mesmo texto ("Unidade 1" +
 * "Resumo de estudo, petição comentada e quiz"), porque o cartão nunca
 * mostrava a cadeira nem o período. O cartão passa a receber `periodo` e
 * `cadeira` (dado real do currículo, nada escrito à mão) para virar
 * inconfundível.
 */
const unidade: ReferenciaUnidade = {
  id: 'u1',
  rotulo: 'Unidade 1',
  titulo: 'Resumo de estudo, petição comentada e quiz',
  estado: 'publicado',
  abas: ['resumo', 'peticao', 'quiz']
};

const periodo1: Periodo = { id: 'p1', numero: 1, rotulo: '1º período', cadeiras: [] };

const cadeiraIntrDireito: Cadeira = {
  id: 'intr-direito',
  nome: 'Introdução ao Direito',
  estado: 'publicado',
  unidades: [unidade]
};

const cadeiraRedacao: Cadeira = {
  id: 'redacao-juridica-1',
  nome: 'Português e Redação Jurídica 1',
  estado: 'publicado',
  unidades: [unidade]
};

describe('CartaoUnidade, distinção entre cadeiras com a mesma unidade', () => {
  it('mostra o nome da própria cadeira', () => {
    const wrapper = mount(CartaoUnidade, {
      props: {
        periodo: periodo1,
        cadeira: cadeiraIntrDireito,
        unidade,
        href: '/p/p1/intr-direito/u1'
      }
    });
    expect(wrapper.text()).toContain('Introdução ao Direito');
  });

  it('dois cartões da mesma unidade em cadeiras diferentes têm textos diferentes', () => {
    const wrapperA = mount(CartaoUnidade, {
      props: {
        periodo: periodo1,
        cadeira: cadeiraIntrDireito,
        unidade,
        href: '/p/p1/intr-direito/u1'
      }
    });
    const wrapperB = mount(CartaoUnidade, {
      props: {
        periodo: periodo1,
        cadeira: cadeiraRedacao,
        unidade,
        href: '/p/p1/redacao-juridica-1/u1'
      }
    });
    expect(wrapperA.text()).not.toBe(wrapperB.text());
    expect(wrapperB.text()).toContain('Português e Redação Jurídica 1');
  });

  it('o nome acessível do link não é só "Unidade 1" (inclui a cadeira)', () => {
    const wrapper = mount(CartaoUnidade, {
      props: {
        periodo: periodo1,
        cadeira: cadeiraRedacao,
        unidade,
        href: '/p/p1/redacao-juridica-1/u1'
      }
    });
    const link = wrapper.find('a');
    // Sem aria-label, o nome acessível vem do texto do próprio link: por
    // isso basta provar que o texto do <a> contém o nome da cadeira.
    expect(link.text()).toContain('Português e Redação Jurídica 1');
    expect(link.attributes('href')).toBe('/p/p1/redacao-juridica-1/u1');
  });

  it('continua mostrando o rótulo da unidade e o progresso, quando houver', () => {
    const wrapper = mount(CartaoUnidade, {
      props: {
        periodo: periodo1,
        cadeira: cadeiraIntrDireito,
        unidade,
        href: '/p/p1/intr-direito/u1',
        progresso: { lidos: 3, total: 9 }
      }
    });
    expect(wrapper.text()).toContain('Unidade 1');
    expect(wrapper.text()).toContain('3 de 9 blocos lidos');
  });
});
