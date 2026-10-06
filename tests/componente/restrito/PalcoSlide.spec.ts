// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PalcoSlide from '@/ui/area-restrita/PalcoSlide.vue';

describe('PalcoSlide', () => {
  it('o conteúdo mora num palco lógico fixo de 1600x900, escalado por transform', () => {
    const w = mount(PalcoSlide, { props: { escala: 0.5 }, slots: { default: '<p>x</p>' } });
    const palco = w.get('.ar-palco-slide__escala');
    expect(palco.attributes('style')).toContain('width: 1600px');
    expect(palco.attributes('style')).toContain('height: 900px');
    expect(palco.attributes('style')).toContain('scale(0.5)');
    expect(palco.text()).toBe('x');
  });

  it('a caixa externa ocupa exatamente o palco escalado, na proporção 16:9', () => {
    const w = mount(PalcoSlide, { props: { escala: 0.5 } });
    const estilo = w.get('.ar-palco-slide').attributes('style')!;
    expect(estilo).toContain('width: 800px');
    expect(estilo).toContain('height: 450px');
  });
});
