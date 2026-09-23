// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BlocoTeorico from '@/ui/componentes/BlocoTeorico.vue';
import type { BlocoResumo } from '@/core/unidade/tipos';

/**
 * BlocoResumo.componenteExtra (unidade de Redação Jurídica 1): quando
 * presente, BlocoTeorico.vue monta o componente interativo correspondente
 * entre corpoHtml e o quadro-resumo. Sem componenteExtra (todo o resto do
 * conteúdo do site), nada muda: nenhum dos três aparece.
 */
function blocoBase(extra: Partial<BlocoResumo> = {}): BlocoResumo {
  return {
    id: 'bloco-x',
    numero: 1,
    titulo: 'Bloco de teste',
    fonte: 'fonte',
    corpoHtml: '<p>corpo</p>',
    resumo: ['item'],
    exemploHtml: '<p>exemplo</p>',
    ...extra
  };
}

describe('BlocoTeorico, componenteExtra', () => {
  it('sem componenteExtra, nenhum dos três extras aparece', () => {
    const wrapper = mount(BlocoTeorico, { props: { bloco: blocoBase(), itensChecklistMarcados: [] } });
    expect(wrapper.findComponent({ name: 'ChecklistArt319' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'CartoesCincoPerguntas' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'DicasFormaProfessora' }).exists()).toBe(false);
  });

  it("componenteExtra 'checklist-art-319' monta o ChecklistArt319 com os marcados recebidos", () => {
    const wrapper = mount(BlocoTeorico, {
      props: {
        bloco: blocoBase({ componenteExtra: 'checklist-art-319' }),
        itensChecklistMarcados: ['cpc-319-item-i']
      }
    });
    expect(wrapper.text()).toContain('1 de 8');
  });

  it("alternar um item do checklist emite 'alternar-item-checklist' com o id", async () => {
    const wrapper = mount(BlocoTeorico, {
      props: {
        bloco: blocoBase({ componenteExtra: 'checklist-art-319' }),
        itensChecklistMarcados: []
      }
    });
    const primeiraCaixa = wrapper.find('input[type="checkbox"]');
    await primeiraCaixa.setValue(true);
    expect(wrapper.emitted('alternar-item-checklist')).toBeTruthy();
  });

  it("componenteExtra 'cartoes-cinco-perguntas' monta os cartões", () => {
    const wrapper = mount(BlocoTeorico, {
      props: {
        bloco: blocoBase({ componenteExtra: 'cartoes-cinco-perguntas' }),
        itensChecklistMarcados: []
      }
    });
    expect(wrapper.findAll('button')).toHaveLength(5);
  });

  it("componenteExtra 'dicas-forma-professora' monta as dicas", () => {
    const wrapper = mount(BlocoTeorico, {
      props: {
        bloco: blocoBase({ componenteExtra: 'dicas-forma-professora' }),
        itensChecklistMarcados: []
      }
    });
    expect(wrapper.text()).toContain('150 linhas');
  });
});
