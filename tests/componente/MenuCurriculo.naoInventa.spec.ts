// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Ordem do líder, 21/09/2026, verbatim: "nao invente menus. o que nao
 * exisyir deixe só o placeholder". src/conteudo/curriculo.ts já segue
 * isso (períodos 2 a 10 nascem com cadeiras: []); este teste prova que o
 * COMPONENTE não acrescenta nada por conta própria quando o dado está
 * vazio: nenhum texto de cadeira nem de unidade fora do que veio do dado.
 */
function curriculoComPeriodosVazios(): Curriculo {
  const periodo1 = {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      {
        id: 'intr-direito',
        nome: 'Introdução ao Direito',
        estado: 'publicado' as const,
        unidades: [
          {
            id: 'u1',
            rotulo: 'Unidade 1',
            titulo: 'Conceito e fontes do Direito',
            estado: 'publicado' as const,
            abas: ['resumo' as const]
          }
        ]
      }
    ]
  };
  const periodosVazios = Array.from({ length: 9 }, (_, i) => ({
    id: `p${i + 2}`,
    numero: i + 2,
    rotulo: `${i + 2}º período`,
    cadeiras: []
  }));
  return [periodo1, ...periodosVazios];
}

describe('MenuCurriculo não inventa item de navegação', () => {
  it('período sem cadeira não mostra nenhum nome de cadeira nem de unidade', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoComPeriodosVazios(), caminhoAtual: '' }
    });

    // Abre todos os períodos (inclusive os vazios) para expor o que cada
    // um realmente renderiza.
    const botoesPeriodo = wrapper.findAll('button[aria-expanded]');
    for (const botao of botoesPeriodo) {
      if (botao.attributes('aria-expanded') === 'false') await botao.trigger('click');
    }

    const texto = wrapper.text();

    // A única cadeira e a única unidade reais têm de aparecer.
    expect(texto).toContain('Introdução ao Direito');
    expect(texto).toContain('Unidade 1');

    // Nenhum rótulo de cadeira ou unidade de exemplo, do tipo que os
    // mockups escreveram à mão (mockups/unidade.html), pode vazar para o
    // componente: nem "Fundamentos do Direito", nem "Unidade 2", nem
    // "Unidade 3", nem qualquer outro nome de disciplina inventado.
    const rotulosProibidos = [
      'Fundamentos do Direito',
      'Unidade 2',
      'Unidade 3',
      'Direito Civil',
      'Direito Penal',
      'Direito Constitucional'
    ];
    for (const rotulo of rotulosProibidos) {
      expect(texto).not.toContain(rotulo);
    }

    // Os nove períodos vazios só podem mostrar o rótulo genérico do
    // período mais "em breve", nunca nome de cadeira.
    for (let numero = 2; numero <= 10; numero++) {
      expect(texto).toContain(`${numero}º período`);
    }
  });
});
