// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BlocoTeorico from '@/ui/componentes/BlocoTeorico.vue';
import type { BlocoResumo } from '@/core/unidade/tipos';

/**
 * Bloco placeholder (ex.: "Aguardando material do professor.") tem resumo: []
 * e exemploHtml: ''. Nenhum dos dois opcionais pode gerar caixa vazia.
 */
function blocoPlaceholder(extra: Partial<BlocoResumo> = {}): BlocoResumo {
  return {
    id: 'bloco-placeholder',
    numero: 17,
    titulo: 'Teorias contemporâneas da justiça',
    fonte: 'Material de aula da disciplina.',
    corpoHtml: '<p>Aguardando material do professor.</p>',
    resumo: [],
    exemploHtml: '',
    ...extra
  };
}

describe('BlocoTeorico, campos opcionais vazios', () => {
  it('resumo vazio e exemplo vazio não geram Quadro-resumo nem exemplo', () => {
    const wrapper = mount(BlocoTeorico, {
      props: { bloco: blocoPlaceholder(), itensChecklistMarcados: [] }
    });
    expect(wrapper.find('.quadro-resumo').exists()).toBe(false);
    expect(wrapper.find('.bloco-teorico__exemplo').exists()).toBe(false);
    expect(wrapper.text()).toContain('Aguardando material do professor.');
  });

  it('com itens de resumo, o Quadro-resumo continua aparecendo', () => {
    const wrapper = mount(BlocoTeorico, {
      props: {
        bloco: blocoPlaceholder({ resumo: ['um item'] }),
        itensChecklistMarcados: []
      }
    });
    expect(wrapper.find('.quadro-resumo').exists()).toBe(true);
  });
});
