// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Home from '@/ui/paginas/Home.vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import { curriculo } from '@/conteudo/curriculo';
import type { Curriculo } from '@/core/curriculo/tipos';

/** Teleport vai para a faixa do layout; aqui ele fica inline, como na página real. */
function montar(c: Curriculo) {
  return mount(Home, {
    global: {
      provide: { [CHAVE_CURRICULO as unknown as symbol]: c },
      stubs: { teleport: true }
    }
  });
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

  it('a cadeira restrita vira placa própria, com selo "Área restrita" e link de entrada', () => {
    const placa = montar(sintetico).get('article.placa--restrita');
    expect(placa.find('h3').text()).toBe('Cadeira Secreta');
    expect(placa.find('.selo').text()).toContain('Área restrita');
    expect(placa.get('a.linha').attributes('href')).toBe('/p/p1/secreta');
  });

  it('cadeira restrita ainda não publicada não ganha placa', () => {
    expect(montar(sintetico).findAll('article.placa')).toHaveLength(1);
  });

  it('no currículo real, cada cadeira restrita publicada tem uma placa restrita, sem conteúdo vazado', () => {
    const w = montar(curriculo);
    const restritas = w.findAll('article.placa--restrita');
    expect(restritas).toHaveLength(2);
    expect(restritas[0]!.get('a.linha').attributes('href')).toBe('/p/p1/interdisciplinar');
    expect(restritas[0]!.text()).not.toMatch(/Resumo|Quiz|Unidade 1|Petição/);
  });

  it('a placa restrita não cria linha de unidade', () => {
    const w = montar(sintetico);
    expect(w.findAll('article.placa--restrita a.linha')).toHaveLength(1);
    expect(w.findAll('a').some((a) => (a.attributes('href') ?? '').endsWith('/u1'))).toBe(false);
  });
});
