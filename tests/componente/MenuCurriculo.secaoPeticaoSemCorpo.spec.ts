// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

/**
 * Pedido do líder, 23/09/2026: a árvore da barra lateral mostra
 * "2. Do Direito" (seção-título sem corpo) na ordem certa entre
 * "1. Dos Fatos" e "2.1 Do Divórcio". MenuCurriculo.vue não lê
 * secao.corpoHtml em lugar nenhum (só id/titulo), então isso já
 * funcionava por desenho; este teste fecha a prova.
 */
function conteudoComPeticaoSegmentada(): ConteudoUnidade {
  return {
    meta: { titulo: 't', subtitulo: 's', descricao: 'd' },
    resumo: [],
    peticao: {
      titulo: 'Petição',
      notaHtml: '',
      secoes: [
        {
          id: 'dos-fatos',
          titulo: '1. Dos Fatos',
          corpoHtml: '<p>x</p>',
          comentarioHtml: '<p>y</p>'
        },
        { id: 'do-direito', titulo: '2. Do Direito', comentarioHtml: '<p>método</p>' },
        {
          id: 'do-direito-divorcio',
          titulo: '2.1 Do Divórcio',
          corpoHtml: '<p>x</p>',
          comentarioHtml: '<p>y</p>'
        }
      ]
    }
  };
}

function curriculoDeTeste(): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
      cadeiras: [
        {
          id: 'redacao-juridica-1',
          nome: 'Português e Redação Jurídica 1',
          estado: 'publicado',
          unidades: [
            {
              id: 'u1',
              rotulo: 'Unidade 1',
              titulo: 'Unidade 1',
              estado: 'publicado',
              abas: ['peticao'],
              carregar: () => Promise.resolve(conteudoComPeticaoSegmentada())
            }
          ]
        }
      ]
    }
  ];
}

describe('MenuCurriculo, seção de peça sem corpo na árvore', () => {
  it('mostra "2. Do Direito" entre "1. Dos Fatos" e "2.1 Do Divórcio", nessa ordem', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoDeTeste(), caminhoAtual: '' }
    });

    await wrapper.find('button[aria-expanded]').trigger('click'); // período
    await wrapper.findAll('button[aria-expanded]')[1]!.trigger('click'); // cadeira
    await wrapper.find('button[aria-label="Mostrar submenu de Unidade 1"]').trigger('click'); // unidade
    await new Promise((r) => setTimeout(r, 0)); // resolve o `carregar()`
    await wrapper.vm.$nextTick();
    const botaoPeticao = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Petição comentada') || b.text().includes('Petição'));
    await botaoPeticao!.trigger('click');

    const linksSecao = wrapper
      .findAll('a')
      .filter((a) =>
        ['1. Dos Fatos', '2. Do Direito', '2.1 Do Divórcio'].includes(a.text().trim())
      );
    expect(linksSecao.map((a) => a.text().trim())).toEqual([
      '1. Dos Fatos',
      '2. Do Direito',
      '2.1 Do Divórcio'
    ]);
  });
});
