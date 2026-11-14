// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PecaComentadaVisor from '@/ui/componentes/PecaComentadaVisor.vue';
import type { PecaComentada } from '@/core/unidade/tipos';

/**
 * Decisão do CPO (13/11, R-CPO-PECA-1): a página da Petição comentada ganha
 * um sumário das seções no topo, igual ao do Resumo, em todos os modos.
 * Devolve no modo adaptado o atalho para as seções que saiu do menu lateral
 * (AV3-F0d, 638da58). Fica entre a nota e o enunciado, como manda a regra.
 */
const SUMARIO = 'nav[aria-label="Sumário da petição"]';

function peca(): PecaComentada {
  return {
    titulo: 'Petição de teste',
    notaHtml: '<p>nota</p>',
    enunciadoHtml: '<p>enunciado do caso</p>',
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
        comentarioHtml: '<p>explica o método</p>'
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

describe('PecaComentadaVisor, sumário das seções', () => {
  it('tem um nav de sumário com um link por seção, na ordem da peça', () => {
    const wrapper = mount(PecaComentadaVisor, { props: { peca: peca() } });
    const nav = wrapper.find(SUMARIO);

    expect(nav.exists()).toBe(true);
    const links = nav.findAll('a');
    expect(links).toHaveLength(3);
    expect(links.map((a) => a.text())).toEqual([
      '1. Dos Fatos',
      '2. Do Direito',
      '2.1 Do Divórcio'
    ]);
  });

  it('cada link aponta para o id da própria seção e o alvo existe na página', () => {
    const wrapper = mount(PecaComentadaVisor, { props: { peca: peca() } });
    const links = wrapper.find(SUMARIO).findAll('a');

    const hrefs = links.map((a) => a.attributes('href'));
    expect(hrefs).toEqual(['#dos-fatos', '#do-direito', '#do-direito-divorcio']);

    for (const href of hrefs) {
      const id = (href ?? '').slice(1);
      expect(wrapper.find(`[id="${id}"]`).exists()).toBe(true);
    }
  });

  it('usa lista sem números (ul), porque os títulos já trazem a numeração', () => {
    const wrapper = mount(PecaComentadaVisor, { props: { peca: peca() } });
    const nav = wrapper.find(SUMARIO);

    expect(nav.find('ul').exists()).toBe(true);
    expect(nav.find('ol').exists()).toBe(false);
  });

  it('fica depois da nota e antes do enunciado, no topo da página', () => {
    const wrapper = mount(PecaComentadaVisor, { props: { peca: peca() } });
    const html = wrapper.html();

    const posNota = html.indexOf('peca-comentada__nota');
    const posSumario = html.indexOf('Sumário da petição');
    const posEnunciado = html.indexOf('peca-comentada__enunciado');

    expect(posNota).toBeGreaterThan(-1);
    expect(posSumario).toBeGreaterThan(posNota);
    expect(posEnunciado).toBeGreaterThan(posSumario);
  });
});
