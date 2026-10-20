// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AberturaHome from '@/ui/componentes/AberturaHome.vue';

describe('AberturaHome, fachada e lema da página inicial', () => {
  const w = mount(AberturaHome);

  it('o título da página é um h1 HTML real, dentro do friso', () => {
    const h1 = w.get('h1');
    expect(h1.text()).toBe('Caderno de Direito');
    expect(h1.element.closest('.fachada')).not.toBeNull();
  });

  it('o desenho do templo é decorativo: o SVG fica escondido do leitor de tela', () => {
    expect(w.get('svg.fachada__svg').attributes('aria-hidden')).toBe('true');
  });

  it('o lema está em latim, marcado com lang="la", e a tradução vem visível', () => {
    const latim = w.get('p.lema__latim');
    expect(latim.attributes('lang')).toBe('la');
    expect(latim.text()).toBe(
      'Iustitia est constans et perpetua voluntas ius suum cuique tribuendi.'
    );
    expect(w.get('p.lema__traducao').text()).toBe(
      'A justiça é a vontade constante e perpétua de dar a cada um o seu direito.'
    );
  });

  it('a atribuição cita Ulpiano, Digesto, 1.1.10, fora da citação (figcaption)', () => {
    expect(w.get('figcaption.lema__fonte').text()).toBe('Ulpiano, Digesto, 1.1.10');
    expect(w.get('figcaption.lema__fonte cite').text()).toBe('Digesto');
    expect(w.get('blockquote').find('figcaption').exists()).toBe(false);
  });

  it('a faixa é uma região nomeada pelo título da página (landmark, sem segundo banner)', () => {
    const regiao = w.get('section.abertura');
    const idDoTitulo = w.get('h1').attributes('id');
    expect(idDoTitulo).toBeTruthy();
    expect(regiao.attributes('aria-labelledby')).toBe(idDoTitulo);
  });

  it('nenhum travessão nem seta no texto visível da abertura', () => {
    expect(w.text()).not.toMatch(/[–—→]/);
  });
});
