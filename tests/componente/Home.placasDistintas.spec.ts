// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Home from '@/ui/paginas/Home.vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Pedido do líder, 23/09/2026: duas cadeiras publicadas no mesmo período,
 * ambas com uma unidade 'u1' de mesmo rótulo e título, precisam ter placas
 * com nome e link diferentes, nunca duas placas idênticas.
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
          estado: 'publicado',
          unidades: [unidade]
        },
        {
          id: 'redacao-juridica-1',
          nome: 'Português e Redação Jurídica 1',
          estado: 'publicado',
          unidades: [unidade]
        }
      ]
    }
  ];
}

describe('Home, placas de cadeiras com unidade de mesmo id', () => {
  it('mostra duas placas com nome e link de unidade diferentes', () => {
    const wrapper = mount(Home, {
      global: {
        provide: { [CHAVE_CURRICULO as unknown as symbol]: curriculoComDuasCadeiras() },
        stubs: { teleport: true }
      }
    });

    const placas = wrapper.findAll('article.placa');
    expect(placas).toHaveLength(2);
    expect(placas[0]!.find('h3').text()).toBe('Introdução ao Direito');
    expect(
      placas[1]!
        .find('h3')
        .text()
        .replace(/\u00a0/g, ' ')
    ).toBe('Português e Redação Jurídica 1');

    const hrefs = wrapper.findAll('a.linha').map((l) => l.attributes('href'));
    expect(new Set(hrefs).size).toBe(2);
    expect(hrefs).toContain('/p/p1/intr-direito/u1');
    expect(hrefs).toContain('/p/p1/redacao-juridica-1/u1');
  });
});
