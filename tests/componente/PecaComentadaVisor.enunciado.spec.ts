// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PecaComentadaVisor from '@/ui/componentes/PecaComentadaVisor.vue';
import type { PecaComentada } from '@/core/unidade/tipos';

/**
 * PecaComentada.enunciadoHtml é novo (unidade de Redação Jurídica 1,
 * ordem do líder 22/09/2026: "para facilitar o entendimento da peça").
 * Precisa aparecer ANTES das seções quando presente, e não quebrar a
 * unidade-piloto, que nunca teve enunciado.
 */
function pecaBase(extra: Partial<PecaComentada> = {}): PecaComentada {
  return {
    titulo: 'Petição de teste',
    notaHtml: '<p>nota</p>',
    secoes: [
      { id: 's1', titulo: 'Seção 1', corpoHtml: '<p>corpo</p>', comentarioHtml: '<p>comentário</p>' }
    ],
    ...extra
  };
}

describe('PecaComentadaVisor, enunciado do caso', () => {
  it('sem enunciadoHtml (unidade-piloto), não renderiza a seção de enunciado', () => {
    const wrapper = mount(PecaComentadaVisor, { props: { peca: pecaBase() } });
    expect(wrapper.find('.peca-comentada__enunciado').exists()).toBe(false);
  });

  it('com enunciadoHtml, renderiza o enunciado ANTES da primeira seção', () => {
    const wrapper = mount(PecaComentadaVisor, {
      props: { peca: pecaBase({ enunciadoHtml: '<p>MARINA e RICARDO...</p>' }) }
    });
    const enunciado = wrapper.find('.peca-comentada__enunciado');
    expect(enunciado.exists()).toBe(true);
    expect(enunciado.html()).toContain('MARINA e RICARDO');

    const html = wrapper.html();
    expect(html.indexOf('peca-comentada__enunciado')).toBeLessThan(
      html.indexOf('peca-comentada__secao')
    );
  });
});
