// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Home from '@/ui/paginas/Home.vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import { curriculo } from '@/conteudo/curriculo';
import type { Curriculo } from '@/core/curriculo/tipos';

function montar(c: Curriculo) {
  return mount(Home, { global: { provide: { [CHAVE_CURRICULO as unknown as symbol]: c } } });
}

describe('Home e a cadeira restrita', () => {
  const sintetico: Curriculo = [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
      cadeiras: [
        {
          id: 'secreta',
          nome: 'Cadeira Secreta',
          estado: 'publicado',
          restrita: true,
          unidades: []
        },
        { id: 'em-obras', nome: 'Em Obras', estado: 'em-breve', restrita: true, unidades: [] }
      ]
    }
  ];

  it('a cadeira restrita aparece como cartão vindo do currículo, com link e indicação discreta', () => {
    const cartao = montar(sintetico).get('a.cartao-restrito');
    expect(cartao.attributes('href')).toBe('/p/p1/secreta');
    expect(cartao.text()).toContain('Cadeira Secreta');
    expect(cartao.text()).toMatch(/área restrita/i);
    expect(cartao.find('h3').text()).toBe('Cadeira Secreta');
  });

  it('cadeira restrita ainda não publicada não ganha cartão', () => {
    expect(montar(sintetico).findAll('a.cartao-restrito')).toHaveLength(1);
  });

  it('no currículo real, o Interdisciplinar aparece uma vez, sem nada do conteúdo restrito', () => {
    const w = montar(curriculo);
    const cartoes = w.findAll('a.cartao-restrito');
    expect(cartoes).toHaveLength(1);
    expect(cartoes[0]!.attributes('href')).toBe('/p/p1/interdisciplinar');
    expect(cartoes[0]!.text()).toContain('Interdisciplinar');
  });

  it('o cartão restrito não cria link duplicado nem cartão de unidade', () => {
    const w = montar(sintetico);
    expect(w.findAll('a.cartao-unidade')).toHaveLength(0);
  });
});
