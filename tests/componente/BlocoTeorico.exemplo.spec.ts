// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BlocoTeorico from '@/ui/componentes/BlocoTeorico.vue';
import type { BlocoResumo } from '@/core/unidade/tipos';

const bloco: BlocoResumo = {
  id: 'bloco-x',
  numero: 1,
  titulo: 'Bloco de teste',
  fonte: 'fonte',
  corpoHtml: '<p>corpo</p>',
  resumo: ['item'],
  exemploHtml: 'Uma frase de exemplo.'
};

describe('BlocoTeorico, parágrafo "Na prática do operador do direito"', () => {
  it('separa o rótulo do texto por um espaço no texto renderizado', () => {
    const wrapper = mount(BlocoTeorico, { props: { bloco } });
    const texto = wrapper.find('.bloco-teorico__exemplo').element.textContent ?? '';
    expect(texto).toContain('operador do direito: Uma frase de exemplo.');
    expect(texto).not.toContain('direito:Uma');
  });
});
