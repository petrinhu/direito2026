// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Home from '@/ui/paginas/Home.vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import { curriculo } from '@/conteudo/curriculo';

describe('Home com o currículo real', () => {
  const wrapper = mount(Home, {
    global: {
      provide: { [CHAVE_CURRICULO as unknown as symbol]: curriculo },
      stubs: { teleport: true }
    }
  });
  const unidades = wrapper.findAll('a.linha:not(.linha--restrita)');
  const placa = (nome: string) =>
    wrapper.findAll('article.placa').find((p) => p.find('h3').text().includes(nome))!;

  // Um link por UNIDADE publicada (Filosofia tem duas: a 1 e a 3). O atalho
  // para o Interdisciplinar não é unidade e não entra nesta conta.
  it('mostra uma linha por unidade publicada, todas com link e nome distintos', () => {
    expect(unidades).toHaveLength(5);
    expect(new Set(unidades.map((l) => l.attributes('href'))).size).toBe(5);
    expect(new Set(unidades.map((l) => l.text())).size).toBe(5);
    expect(unidades.some((l) => (l.attributes('href') ?? '').endsWith('/u2'))).toBe(false);
  });

  it('cada cadeira pública traz o atalho para o Interdisciplinar, e a restrita traz o link de entrada', () => {
    const links = wrapper
      .findAll('a')
      .filter((a) => a.attributes('href') === '/p/p1/interdisciplinar');
    expect(links).toHaveLength(5);
  });

  it('a Filosofia Jurídica mostra a Unidade 3 e não oferece petição', () => {
    const p = placa('Filosofia Jurídica');
    expect(p.text()).toContain('Filosofia Moderna e Contemporânea');
    expect(p.text().toLowerCase()).not.toContain('peti');
  });

  it('a Sociologia Jurídica não oferece petição em lugar nenhum da página', () => {
    expect(placa('Sociologia Jurídica').text().toLowerCase()).not.toContain('peti');
    expect(
      wrapper.findAll('a').some((a) => (a.attributes('href') ?? '').includes('/peticao'))
    ).toBe(false);
  });

  it('o numeral romano do período e a linha dos demais aparecem uma vez, derivados do currículo', () => {
    expect(wrapper.findAll('.periodo__numeral').map((n) => n.text())).toEqual(['I']);
    expect(wrapper.get('.em-preparo').text()).toBe('Do 2º ao 10º período: material em preparação.');
  });
});
