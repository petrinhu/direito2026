// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import { curriculo as curriculoReal } from '@/conteudo/curriculo';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Ordem do líder (20/10/2026): "A estrutura do menu lateral deve ser: Filosofia
 * Jurídica | -- Unidade 1 | -- Interdisciplinar | -- Unidade 3. Deve ser
 * recolhível, como já é. O mesmo pras outras cadeiras". O atalho é o item
 * "Interdisciplinar" dentro da lista recolhível da cadeira, logo depois da
 * Unidade 1.
 */

const RotuloAtalho = 'Interdisciplinar';
const NomeAcessivelAtalho = 'Interdisciplinar, atalho para a área restrita';

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
            rotulo: RotuloAtalho,
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

function curriculoFilosofia(): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
      cadeiras: [
        {
          id: 'filosofia-juridica',
          nome: 'Filosofia Jurídica',
          estado: 'publicado',
          unidades: [
            {
              id: 'u1',
              rotulo: 'Unidade 1',
              titulo: 'Idade Antiga',
              estado: 'publicado',
              abas: []
            },
            { id: 'u3', rotulo: 'Unidade 3', titulo: 'Moderna', estado: 'publicado', abas: [] }
          ],
          atalhoUnidade: { apos: 'u1', rotulo: RotuloAtalho, cadeiraId: 'interdisciplinar' }
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

const montados: VueWrapper[] = [];

function montar(curriculo: Curriculo, caminhoAtual = ''): VueWrapper {
  const w = mount(MenuCurriculo, {
    props: { curriculo, caminhoAtual },
    attachTo: document.body
  });
  montados.push(w);
  return w;
}

afterEach(() => {
  while (montados.length > 0) montados.pop()!.unmount();
});

async function abrirPeriodoECadeira(w: VueWrapper, cadeiraId: string): Promise<void> {
  await w.get('button[aria-controls="lista-p1"]').trigger('click');
  await w.get(`button[aria-controls="lista-${cadeiraId}"]`).trigger('click');
}

/** Textos dos itens que estão DENTRO da lista da cadeira, na ordem do DOM. */
function itensDaCadeira(w: VueWrapper, cadeiraId: string): string[] {
  return w.findAll(`#lista-${cadeiraId} > li`).map((li) => li.text().trim());
}

function atalhoDa(w: VueWrapper, cadeiraId: string) {
  return w.get(`#lista-${cadeiraId} a[href="/p/p1/interdisciplinar"]`);
}

describe('MenuCurriculo, atalho Interdisciplinar dentro da cadeira', () => {
  it('o texto visível do atalho é exatamente "Interdisciplinar", sem "Unidade 2"', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'intr-direito');

    expect(atalhoDa(w, 'intr-direito').text()).toBe('Interdisciplinar');
  });

  it('na Introdução ao Direito a ordem da lista é Unidade 1, depois o atalho', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'intr-direito');

    expect(itensDaCadeira(w, 'intr-direito')).toEqual(['Unidade 1', 'Interdisciplinar']);
  });

  it('em Filosofia Jurídica a ordem é Unidade 1, Interdisciplinar, Unidade 3', async () => {
    const w = montar(curriculoFilosofia());
    await abrirPeriodoECadeira(w, 'filosofia-juridica');

    expect(itensDaCadeira(w, 'filosofia-juridica')).toEqual([
      'Unidade 1',
      'Interdisciplinar',
      'Unidade 3'
    ]);
  });

  it('o atalho fica DENTRO da lista recolhível: some quando a cadeira está fechada', async () => {
    const w = montar(curriculoComAtalho());
    await w.get('button[aria-controls="lista-p1"]').trigger('click');

    expect(atalhoDa(w, 'intr-direito').isVisible()).toBe(false);

    await w.get('button[aria-controls="lista-intr-direito"]').trigger('click');
    expect(atalhoDa(w, 'intr-direito').isVisible()).toBe(true);

    await w.get('button[aria-controls="lista-intr-direito"]').trigger('click');
    expect(atalhoDa(w, 'intr-direito').isVisible()).toBe(false);
  });

  it('o atalho não tem triângulo de submenu e não cria link para unidade falsa', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'intr-direito');

    expect(w.findAll('.menu-curriculo__toggle')).toHaveLength(1);
    expect(w.find('a[href="/p/p1/intr-direito/u2"]').exists()).toBe(false);
  });

  it('o item próprio Interdisciplinar continua existindo, ao lado do atalho', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'intr-direito');

    expect(w.findAll('a[href="/p/p1/interdisciplinar"]')).toHaveLength(2);
  });

  it('o atalho tem nome acessível que o distingue do item próprio Interdisciplinar', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'intr-direito');

    const atalho = atalhoDa(w, 'intr-direito');
    expect(atalho.attributes('aria-label')).toBe(NomeAcessivelAtalho);
    // Label in Name (WCAG 2.5.3): o nome acessível começa pelo texto visível.
    expect(NomeAcessivelAtalho.startsWith(atalho.text())).toBe(true);

    const itemProprio = w.get('#lista-p1 > li > a[href="/p/p1/interdisciplinar"]');
    expect(itemProprio.attributes('aria-label')).toBeUndefined();
    expect(itemProprio.text()).toBe('Interdisciplinar');
  });

  it('marca aria-current no atalho quando a página aberta é a cadeira restrita', () => {
    const w = montar(curriculoComAtalho(), 'p/p1/interdisciplinar');
    const atalho = w.get('a[href="/p/p1/interdisciplinar"]');
    expect(atalho.attributes('aria-current')).toBe('page');
  });

  it('cadeira sem atalho não ganha link extra', async () => {
    const w = montar(curriculoComAtalho());
    await abrirPeriodoECadeira(w, 'sem-atalho');

    expect(w.find('#lista-sem-atalho a[href="/p/p1/interdisciplinar"]').exists()).toBe(false);
  });
});

describe('MenuCurriculo com o currículo real: o atalho está em todas as cadeiras públicas', () => {
  it.each([
    ['intr-direito', ['Unidade 1', 'Interdisciplinar']],
    ['redacao-juridica-1', ['Unidade 1', 'Interdisciplinar']],
    ['sociologia-juridica', ['Unidade 1', 'Interdisciplinar']],
    ['filosofia-juridica', ['Unidade 1', 'Interdisciplinar', 'Unidade 3']]
  ])('%s: lista = %j', async (cadeiraId, esperado) => {
    const w = montar(curriculoReal);
    await abrirPeriodoECadeira(w, cadeiraId);

    expect(itensDaCadeira(w, cadeiraId)).toEqual(esperado);
  });
});
