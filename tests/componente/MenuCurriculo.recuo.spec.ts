// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Recuo da árvore do menu lateral (ordem do líder, 22/09/2026, itens 1 e 4).
 * Defeito medido no Firefox a 1920px: nenhum nível tinha recuo, e o triângulo
 * da unidade ficava à direita. Causa: `.menu-curriculo ul` (reset de margem e
 * padding) vira `.menu-curriculo ul[data-v-x]` no CSS escopado, especificidade
 * (0,2,1), que vence `.menu-curriculo__nivel-N[data-v-x]` (0,2,0): o recuo
 * declarado nunca valia. jsdom não faz layout, então a prova em pixels é do
 * e2e (menu-recuo.spec.ts); aqui ficam a estrutura e a especificidade.
 */
const fonte = readFileSync(
  resolve(__dirname, '../../src/ui/componentes/MenuCurriculo.vue'),
  'utf-8'
);

describe('MenuCurriculo, especificidade das regras de recuo', () => {
  it.each([2, 3, 4, 5])(
    'o recuo do nível %i vem de um seletor mais forte que o reset `.menu-curriculo ul`',
    (nivel) => {
      const regra = new RegExp(
        `\\.menu-curriculo ul\\.menu-curriculo__nivel-${nivel}\\s*\\{[^}]*margin-left:`
      );
      expect(fonte).toMatch(regra);
    }
  );
});

describe('MenuCurriculo, indicador de abrir e fechar do lado esquerdo', () => {
  const curriculo: Curriculo = [
    {
      id: 'p1',
      numero: 1,
      rotulo: '1º período',
      cadeiras: [
        {
          id: 'c',
          nome: 'Cadeira',
          estado: 'publicado',
          unidades: [
            {
              id: 'u1',
              rotulo: 'Unidade 1',
              titulo: 'Unidade 1',
              estado: 'publicado',
              abas: ['resumo', 'quiz']
            }
          ]
        }
      ]
    }
  ];

  it('na linha da unidade, o botão com o triângulo vem ANTES do link (ordem visual e de Tab)', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await wrapper.find('button[aria-expanded]').trigger('click');
    await wrapper.findAll('button[aria-expanded]')[1]!.trigger('click');
    const linha = wrapper.find('.menu-curriculo__linha').element;
    const filhos = Array.from(linha.children).map((f) => f.className);
    const toggle = filhos.findIndex((c) => c.includes('menu-curriculo__toggle'));
    const link = filhos.findIndex((c) => c.includes('menu-curriculo__link-unidade'));
    expect(toggle).toBe(0);
    expect(link).toBe(1);
  });
});

describe('MenuCurriculo, cor própria por nível', () => {
  it.each([
    [2, 'cadeira'],
    [3, 'unidade'],
    [4, 'aba'],
    [5, 'item']
  ])('a lista do nível %i define --menu-cor com o token --cor-menu-%s', (nivel, token) => {
    const regra = new RegExp(
      `\\.menu-curriculo ul\\.menu-curriculo__nivel-${nivel}\\s*\\{[^}]*--menu-cor:\\s*var\\(--cor-menu-${token}`
    );
    expect(fonte).toMatch(regra);
  });

  it('botões e links leem --menu-cor, e o item atual segue com a cor de destaque', () => {
    expect(fonte).toMatch(/\.menu-curriculo__botao\s*\{[^}]*color:\s*var\(--menu-cor/);
    expect(fonte).toMatch(/\.menu-curriculo a\s*\{[^}]*color:\s*var\(--menu-cor/);
    expect(fonte).toMatch(
      /a\[aria-current='page'\]\s*\{[^}]*color:\s*var\(--cor-sidebar-item-ativo-texto/
    );
  });
});
