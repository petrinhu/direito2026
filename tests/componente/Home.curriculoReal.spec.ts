// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Home from '@/ui/paginas/Home.vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import { curriculo } from '@/conteudo/curriculo';

describe('Home com o currículo real', () => {
  const wrapper = mount(Home, {
    global: { provide: { [CHAVE_CURRICULO as unknown as symbol]: curriculo } }
  });
  const links = wrapper.findAll('a.cartao-unidade');

  // Um cartão por UNIDADE publicada (Filosofia tem duas: a 1 e a 3). O atalho
  // do menu para o interdisciplinar não é unidade, então não ganha cartão.
  it('mostra um cartão por unidade publicada, os cinco com link e nome distintos', () => {
    expect(links).toHaveLength(5);
    expect(new Set(links.map((l) => l.attributes('href'))).size).toBe(5);
    expect(new Set(links.map((l) => l.text())).size).toBe(5);
    expect(links.some((l) => (l.attributes('href') ?? '').endsWith('/u2'))).toBe(false);
  });

  it('o cartão de Filosofia Jurídica traz o nome da cadeira e não oferece petição', () => {
    const cartao = links.find((l) => l.attributes('href') === '/p/p1/filosofia-juridica/u1')!;
    expect(cartao.text()).toContain('Filosofia Jurídica');
    expect(cartao.text().toLowerCase()).not.toContain('peti');
  });

  it('o cartão de Sociologia Jurídica traz o nome da cadeira e não oferece petição', () => {
    const cartao = links.find((l) => l.attributes('href') === '/p/p1/sociologia-juridica/u1')!;
    expect(cartao.text()).toContain('Sociologia Jurídica');
    expect(cartao.text().toLowerCase()).not.toContain('peti');
    expect(
      wrapper.findAll('a').some((a) => (a.attributes('href') ?? '').includes('/peticao'))
    ).toBe(false);
  });
});
