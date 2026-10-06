// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

const curriculo: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1o período',
    cadeiras: [
      {
        id: 'restrita-x',
        nome: 'Cadeira Restrita',
        estado: 'publicado',
        restrita: true,
        unidades: []
      }
    ]
  }
];

describe('MenuCurriculo com cadeira restrita', () => {
  it('é um link direto para a página, sem botão de expandir nem lista vazia', async () => {
    const w = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await w.get('button[aria-controls="lista-p1"]').trigger('click');
    const link = w.find('a[href="/p/p1/restrita-x"]');
    expect(link.exists()).toBe(true);
    expect(link.text()).toBe('Cadeira Restrita');
    expect(w.find('button[aria-controls="lista-restrita-x"]').exists()).toBe(false);
  });

  it('marca aria-current quando é a página aberta', () => {
    const w = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: 'p/p1/restrita-x' } });
    expect(w.get('a[href="/p/p1/restrita-x"]').attributes('aria-current')).toBe('page');
  });
});
