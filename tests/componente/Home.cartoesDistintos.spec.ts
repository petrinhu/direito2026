// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Home from '@/ui/paginas/Home.vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Pedido do líder, 23/09/2026: cartão da unidade nova na página inicial.
 * Com duas cadeiras publicadas no mesmo período, cada uma com uma
 * unidade 'u1' de mesmo rótulo/título, os dois cartões precisam ter
 * texto e link diferentes — nunca dois cartões idênticos, que é como se
 * o segundo não existisse para quem olha a página.
 */
function curriculoComDuasCadeiras(): Curriculo {
  const unidade = {
    id: 'u1',
    rotulo: 'Unidade 1',
    titulo: 'Resumo de estudo, petição comentada e quiz',
    estado: 'publicado' as const,
    abas: ['resumo' as const, 'peticao' as const, 'quiz' as const]
  };
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
      cadeiras: [
        {
          id: 'intr-direito',
          nome: 'Introdução ao Direito',
          estado: 'publicado' as const,
          unidades: [unidade]
        },
        {
          id: 'redacao-juridica-1',
          nome: 'Português e Redação Jurídica 1',
          estado: 'publicado' as const,
          unidades: [unidade]
        }
      ]
    }
  ];
}

describe('Home, cartões de unidades com o mesmo id em cadeiras diferentes', () => {
  it('mostra dois cartões com nome de cadeira diferente e href diferente', () => {
    const wrapper = mount(Home, {
      global: { provide: { [CHAVE_CURRICULO as unknown as symbol]: curriculoComDuasCadeiras() } }
    });

    expect(wrapper.text()).toContain('Introdução ao Direito');
    expect(wrapper.text()).toContain('Português e Redação Jurídica 1');

    const links = wrapper.findAll('a.cartao-unidade');
    expect(links).toHaveLength(2);
    const hrefs = links.map((l) => l.attributes('href'));
    expect(new Set(hrefs).size).toBe(2);
    expect(hrefs).toContain('/p/p1/intr-direito/u1');
    expect(hrefs).toContain('/p/p1/redacao-juridica-1/u1');

    const textos = links.map((l) => l.text());
    expect(textos[0]).not.toBe(textos[1]);
  });
});
