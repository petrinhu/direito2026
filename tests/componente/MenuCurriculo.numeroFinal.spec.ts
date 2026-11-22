// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import { rotuloDoMenu } from '@/ui/componentes/rotuloDoMenu';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * QA-MENU-PRJ1: no menu a 1280 px, o "1" de "Português e Redação Jurídica 1"
 * ficava sozinho na linha de baixo. A regra vale para todo nome do menu que
 * termina em número, de qualquer tamanho ("2026", "27.1"): o último espaço
 * vira U+00A0 (espaço não separável), e o número não se separa do nome.
 * Layout real só se mede no navegador (e2e); aqui se prova o caractere.
 */
const NBSP = '\u00a0';

function curriculoDeTeste(cadeira: string, unidade: string): Curriculo {
  return [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
      cadeiras: [
        {
          id: 'c',
          nome: cadeira,
          estado: 'publicado',
          unidades: [
            {
              id: 'u1',
              rotulo: unidade,
              titulo: unidade,
              estado: 'publicado',
              abas: []
            }
          ]
        }
      ]
    }
  ];
}

/** Botão da cadeira (não o do período): o que contém o texto pedido. */
function botaoComTexto(wrapper: ReturnType<typeof mount>, trecho: string) {
  const achado = wrapper.findAll('button').find((b) => b.text().includes(trecho));
  if (!achado) throw new Error(`nenhum botão com "${trecho}"`);
  return achado;
}

describe('rotuloDoMenu, espaço não separável antes do número final', () => {
  it.each([
    ['Português e Redação Jurídica 1', `Português e Redação Jurídica${NBSP}1`],
    ['Teoria Geral do Direito 2026', `Teoria Geral do Direito${NBSP}2026`],
    ['Rematrícula com desconto 27.1', `Rematrícula com desconto${NBSP}27.1`],
    ['Unidade 10', `Unidade${NBSP}10`]
  ])('"%s" liga o número ao nome', (entrada, esperado) => {
    expect(rotuloDoMenu(entrada)).toBe(esperado);
  });

  it('nome sem número final não ganha espaço não separável', () => {
    expect(rotuloDoMenu('Direito Civil')).toBe('Direito Civil');
  });

  it('só o último espaço muda: números no meio do nome ficam como estão', () => {
    expect(rotuloDoMenu('A escada brasileira: 1 + 4 + 1')).toBe(
      `A escada brasileira: 1 + 4 +${NBSP}1`
    );
  });

  it('é idempotente: aplicar de novo não troca nada', () => {
    const uma = rotuloDoMenu('Português e Redação Jurídica 1');
    expect(rotuloDoMenu(uma)).toBe(uma);
  });
});

describe('MenuCurriculo, nomes com número final não deixam o número sozinho', () => {
  it('o nome da cadeira com número de 1 dígito liga o número com U+00A0', () => {
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoDeTeste('Português e Redação Jurídica 1', 'Unidade 1'),
        caminhoAtual: ''
      }
    });
    expect(botaoComTexto(wrapper, 'Redação').text()).toBe(`Português e Redação Jurídica${NBSP}1`);
  });

  it('o nome da cadeira com número de 4 dígitos também liga o número', () => {
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoDeTeste('Teoria Geral do Direito 2026', 'Unidade 1'),
        caminhoAtual: ''
      }
    });
    expect(botaoComTexto(wrapper, 'Teoria').text()).toBe(`Teoria Geral do Direito${NBSP}2026`);
  });

  it('o rótulo da unidade com número final liga o número', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoDeTeste('Cadeira', 'Unidade 2026'),
        caminhoAtual: ''
      }
    });
    await botaoComTexto(wrapper, 'Cadeira').trigger('click');
    const link = wrapper.find('a.menu-curriculo__link-unidade');
    expect(link.text()).toBe(`Unidade${NBSP}2026`);
  });

  it('nenhum botão ou link do menu termina em espaço comum antes de número', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoDeTeste('Português e Redação Jurídica 1', 'Unidade 2026'),
        caminhoAtual: ''
      }
    });
    await botaoComTexto(wrapper, 'Redação').trigger('click');
    for (const el of wrapper.findAll('button, a')) {
      expect(el.text()).not.toMatch(/ \d[\d.,]*$/);
    }
  });
});
