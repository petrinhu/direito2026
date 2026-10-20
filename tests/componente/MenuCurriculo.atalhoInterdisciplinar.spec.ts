// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

function curriculoComAtalho(): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
      cadeiras: [
        {
          id: 'intr-direito',
          nome: 'Introdução ao Direito',
          estado: 'publicado',
          unidades: [
            {
              id: 'u1',
              rotulo: 'Unidade 1',
              titulo: 'Conceito e fontes do Direito',
              estado: 'publicado',
              abas: ['resumo']
            }
          ],
          atalhoUnidade: {
            apos: 'u1',
            rotulo: 'Unidade 2: Interdisciplinar',
            cadeiraId: 'interdisciplinar'
          }
        },
        {
          id: 'sem-atalho',
          nome: 'Cadeira Sem Atalho',
          estado: 'publicado',
          unidades: []
        },
        {
          id: 'interdisciplinar',
          nome: 'Interdisciplinar',
          estado: 'publicado',
          restrita: true,
          unidades: []
        }
      ]
    }
  ];
}

async function abrirPeriodoECadeira(
  w: ReturnType<typeof mount>,
  cadeiraId: string
): Promise<void> {
  await w.get('button[aria-controls="lista-p1"]').trigger('click');
  await w.get(`button[aria-controls="lista-${cadeiraId}"]`).trigger('click');
}

describe('MenuCurriculo, atalho para a Unidade 2 (Interdisciplinar)', () => {
  it('mostra o atalho como link para a cadeira restrita, depois da Unidade 1', async () => {
    const w = mount(MenuCurriculo, {
      props: { curriculo: curriculoComAtalho(), caminhoAtual: '' }
    });
    await abrirPeriodoECadeira(w, 'intr-direito');

    const atalho = w.get('a[href="/p/p1/interdisciplinar"]');
    expect(atalho.text()).toBe('Unidade 2: Interdisciplinar');

    const html = w.html();
    expect(html.indexOf('Unidade 1')).toBeGreaterThan(-1);
    expect(html.indexOf('Unidade 1')).toBeLessThan(html.indexOf('Unidade 2: Interdisciplinar'));
  });

  it('o atalho não tem triângulo de submenu e não cria link para unidade falsa', async () => {
    const w = mount(MenuCurriculo, {
      props: { curriculo: curriculoComAtalho(), caminhoAtual: '' }
    });
    await abrirPeriodoECadeira(w, 'intr-direito');

    expect(w.findAll('.menu-curriculo__toggle')).toHaveLength(1);
    expect(w.find('a[href="/p/p1/intr-direito/u2"]').exists()).toBe(false);
  });

  it('o item próprio Interdisciplinar continua existindo, ao lado do atalho', async () => {
    const w = mount(MenuCurriculo, {
      props: { curriculo: curriculoComAtalho(), caminhoAtual: '' }
    });
    await abrirPeriodoECadeira(w, 'intr-direito');

    expect(w.findAll('a[href="/p/p1/interdisciplinar"]')).toHaveLength(2);
  });

  it('marca aria-current no atalho quando a página aberta é a cadeira restrita', () => {
    const w = mount(MenuCurriculo, {
      props: { curriculo: curriculoComAtalho(), caminhoAtual: 'p/p1/interdisciplinar' }
    });
    const atalho = w.get('a[href="/p/p1/interdisciplinar"]');
    expect(atalho.attributes('aria-current')).toBe('page');
  });

  it('cadeira sem atalho não ganha link extra', async () => {
    const w = mount(MenuCurriculo, {
      props: { curriculo: curriculoComAtalho(), caminhoAtual: '' }
    });
    await abrirPeriodoECadeira(w, 'sem-atalho');

    // O atalho da Introdução existe no DOM (o submenu dela é só ocultado);
    // o que importa é que a lista da cadeira sem atalho não o ganha.
    expect(w.find('#lista-sem-atalho a[href="/p/p1/interdisciplinar"]').exists()).toBe(false);
  });
});
