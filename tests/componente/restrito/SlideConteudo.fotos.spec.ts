// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import SlideConteudo from '@/ui/area-restrita/SlideConteudo.vue';
import type { EquipeRestrita, Slide } from '@/core/restrito/tipos';

// Imagem sintética: o componente só repassa o data URI, nunca decodifica pixel.
const IMAGEM = 'data:image/jpeg;base64,QUJDRA==';
const equipe: EquipeRestrita = { instituicao: 'Instituição Fictícia', integrantes: ['Pessoa Um'] };

function slideDeFotos(imagens: Slide['imagens'], subtitulo?: string): Slide {
  return {
    id: 9,
    layout: 'fotos',
    titulo: 'Título fictício de fotos',
    ...(subtitulo ? { subtitulo } : {}),
    notas: 'Nota fictícia.',
    imagens
  };
}

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  vi.restoreAllMocks();
});

function montar(slide: Slide): VueWrapper {
  w = mount(SlideConteudo, { props: { slide, equipe, rotulo: 'Slide 9 de 13' } });
  return w;
}

describe('SlideConteudo: layout de fotos', () => {
  it('duas imagens lado a lado, cada uma com alt e legenda', () => {
    const c = montar(
      slideDeFotos([
        { src: IMAGEM, alt: 'Primeira imagem fictícia', legenda: 'Legenda um' },
        { src: IMAGEM, alt: 'Segunda imagem fictícia' }
      ])
    );
    expect(c.classes()).toContain('ar-slide--fotos');
    expect(c.get('.ar-slide__fotos').attributes('data-n')).toBe('2');
    const imgs = c.findAll('.ar-slide__foto img');
    expect(imgs.map((i) => i.attributes('alt'))).toEqual([
      'Primeira imagem fictícia',
      'Segunda imagem fictícia'
    ]);
    expect(imgs[0]!.attributes('src')).toBe(IMAGEM);
    expect(c.findAll('.ar-slide__foto figcaption').map((f) => f.text())).toEqual(['Legenda um']);
  });

  it('uma imagem sem legenda não cria figcaption', () => {
    const c = montar(slideDeFotos([{ src: IMAGEM, alt: 'Imagem única fictícia' }]));
    expect(c.get('.ar-slide__fotos').attributes('data-n')).toBe('1');
    expect(c.findAll('.ar-slide__foto')).toHaveLength(1);
    expect(c.find('figcaption').exists()).toBe(false);
  });

  it('título e subtítulo opcional entram como nos demais slides', () => {
    const c = montar(slideDeFotos([{ src: IMAGEM, alt: 'a' }], 'Subtítulo fictício'));
    expect(c.get('.ar-slide__titulo').text()).toBe('Título fictício de fotos');
    expect(c.get('.ar-slide__subtitulo').text()).toBe('Subtítulo fictício');
  });

  it('não cai no ramo do encerramento', () => {
    const c = montar(slideDeFotos([{ src: IMAGEM, alt: 'a' }]));
    expect(c.find('.ar-slide__fim').exists()).toBe(false);
  });

  it('a moldura usa o acento da área, a imagem 4:3 com recorte e cantos arredondados', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/ui/area-restrita/SlideConteudo.vue', 'utf-8');
    const regra = css.slice(
      css.indexOf('.ar-slide__foto img {'),
      css.indexOf('.ar-slide__foto figcaption')
    );
    expect(regra).toContain('aspect-ratio: 4 / 3');
    expect(regra).toContain('object-fit: cover');
    expect(regra).toContain('border-radius: 16px');
    expect(regra).toContain('border: 2px solid var(--s-acento)');
  });
});
