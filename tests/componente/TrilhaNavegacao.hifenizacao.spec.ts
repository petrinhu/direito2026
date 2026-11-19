// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TrilhaNavegacao from '@/ui/componentes/TrilhaNavegacao.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Hífen mole (U+00AD) só no texto visível do link da trilha. O aria-label de
 * cada link leva o rótulo original, sem U+00AD, para o nome acessível não
 * carregar o caractere invisível.
 */
const SHY = '­';

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
              abas: ['resumo', 'peticao', 'mnemonicos']
            }
          ]
        }
      ]
    }
  ];
}

describe('TrilhaNavegacao: hífen mole nos nomes das abas', () => {
  it('o texto visível da aba Mnemônicos leva U+00AD entre sílabas', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: 'p/p1/intr-direito/u1/mnemonicos' }
    });
    const atual = wrapper.find('a[aria-current="page"]');
    expect(atual.text()).toContain(SHY);
    expect(atual.text().replaceAll(SHY, '')).toBe('Mnemônicos');
  });

  it('o aria-label do mesmo link tem o rótulo original, sem U+00AD', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: 'p/p1/intr-direito/u1/mnemonicos' }
    });
    const atual = wrapper.find('a[aria-current="page"]');
    expect(atual.attributes('aria-label')).toBe('Mnemônicos');
    expect(atual.attributes('aria-label')).not.toContain(SHY);
  });

  it('nenhum aria-label da trilha contém U+00AD, em nenhum nível', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: 'p/p1/intr-direito/u1/peticao' }
    });
    for (const link of wrapper.findAll('a')) {
      expect(link.attributes('aria-label') ?? '').not.toContain(SHY);
    }
  });

  it('item fora da tabela (nome de cadeira) não ganha U+00AD no texto', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: 'p/p1/intr-direito/u1' }
    });
    expect(wrapper.findAll('a')[1]!.text()).not.toContain(SHY);
  });
});
