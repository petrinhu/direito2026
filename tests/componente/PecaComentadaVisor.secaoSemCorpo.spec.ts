// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PecaComentadaVisor from '@/ui/componentes/PecaComentadaVisor.vue';
import type { PecaComentada } from '@/core/unidade/tipos';

/**
 * Pedido do líder, 23/09/2026: a seção "2. Do Direito" da petição
 * comentada de Redação Jurídica 1 é só um título "guarda-chuva" (como no
 * quadro da professora) — sem corpoHtml próprio, só título e comentário
 * explicando o método. O visor precisa aceitar isso sem desenhar bloco
 * vazio nem deixar espaço em branco onde o corpo ficaria.
 */
function peca(): PecaComentada {
  return {
    titulo: 'Petição de teste',
    notaHtml: '<p>nota</p>',
    secoes: [
      {
        id: 'dos-fatos',
        titulo: '1. Dos Fatos',
        corpoHtml: '<p>fatos</p>',
        comentarioHtml: '<p>comentário dos fatos</p>'
      },
      {
        id: 'do-direito',
        titulo: '2. Do Direito',
        // sem corpoHtml de propósito
        comentarioHtml: '<p>explica o método fato/fundamento/pedido</p>'
      },
      {
        id: 'do-direito-divorcio',
        titulo: '2.1 Do Divórcio',
        corpoHtml: '<p>divórcio</p>',
        comentarioHtml: '<p>comentário do divórcio</p>'
      }
    ]
  };
}

describe('PecaComentadaVisor, seção sem corpo', () => {
  it('mostra o título e o comentário da seção sem corpo, sem bloco de corpo vazio', () => {
    const wrapper = mount(PecaComentadaVisor, { props: { peca: peca() } });

    const secaoDoDireito = wrapper.find('#do-direito');
    expect(secaoDoDireito.exists()).toBe(true);
    expect(secaoDoDireito.text()).toContain('2. Do Direito');
    expect(secaoDoDireito.text()).toContain('explica o método fato/fundamento/pedido');

    // Nenhum elemento de corpo (a classe que carrega secao.corpoHtml) foi
    // desenhado dentro dessa seção — nem vazio, nem com espaço reservado.
    expect(secaoDoDireito.find('.peca-comentada__corpo').exists()).toBe(false);
  });

  it('as seções com corpo continuam mostrando o corpo normalmente', () => {
    const wrapper = mount(PecaComentadaVisor, { props: { peca: peca() } });
    const secaoFatos = wrapper.find('#dos-fatos');
    expect(secaoFatos.find('.peca-comentada__corpo').exists()).toBe(true);
    expect(secaoFatos.text()).toContain('fatos');
  });

  it('as três seções aparecem na ordem certa (títulos, de cima para baixo)', () => {
    const wrapper = mount(PecaComentadaVisor, { props: { peca: peca() } });
    const titulos = wrapper.findAll('h3').map((h) => h.text());
    expect(titulos).toEqual(['1. Dos Fatos', '2. Do Direito', '2.1 Do Divórcio']);
  });
});
