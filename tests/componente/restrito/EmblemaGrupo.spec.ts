// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import EmblemaGrupo from '@/ui/area-restrita/EmblemaGrupo.vue';

const completo = {
  './emblema/emblema-320.avif': '/f/320.avif',
  './emblema/emblema-640.avif': '/f/640.avif',
  './emblema/emblema-320.webp': '/f/320.webp',
  './emblema/emblema-640.webp': '/f/640.webp',
  './emblema/emblema-320.jpg': '/f/320.jpg',
  './emblema/emblema-640.jpg': '/f/640.jpg'
};

describe('EmblemaGrupo', () => {
  it('sem os arquivos, não desenha nada (a área funciona sem o emblema)', () => {
    const w = mount(EmblemaGrupo, { props: { arquivos: {} } });
    expect(w.find('picture').exists()).toBe(false);
    expect(w.find('img').exists()).toBe(false);
  });

  it('só com o JPEG: imagem com fallback e sem sources', () => {
    const w = mount(EmblemaGrupo, {
      props: {
        arquivos: {
          './emblema/emblema-320.jpg': '/f/320.jpg',
          './emblema/emblema-640.jpg': '/f/640.jpg'
        }
      }
    });
    expect(w.findAll('source')).toHaveLength(0);
    expect(w.get('img').attributes('src')).toBe('/f/320.jpg');
  });

  it('com os seis arquivos: AVIF, WebP e JPEG em 320 e 640, dimensão fixa e alt descritivo', () => {
    const w = mount(EmblemaGrupo, { props: { arquivos: completo } });
    const fontes = w.findAll('source');
    expect(fontes.map((f) => f.attributes('type'))).toEqual(['image/avif', 'image/webp']);
    expect(fontes[0]!.attributes('srcset')).toBe('/f/320.avif 320w, /f/640.avif 640w');
    const img = w.get('img');
    expect(img.attributes('srcset')).toBe('/f/320.jpg 320w, /f/640.jpg 640w');
    expect(img.attributes('width')).toBe('320');
    expect(img.attributes('height')).toBe('320');
    expect(img.attributes('alt')).toMatch(/Fronteiras da Inteligência Artificial/);
  });

  it('o emblema pequeno (slide) não disputa prioridade de rede', () => {
    const w = mount(EmblemaGrupo, { props: { arquivos: completo, tamanho: 'pequeno' } });
    expect(w.get('img').attributes('fetchpriority')).toBe('low');
  });
});
