// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import { curriculo } from '@/conteudo/curriculo';

/**
 * Pedido do líder, 23/09/2026: a barra lateral (MenuCurriculo.vue, que
 * LayoutBase.vue monta em TODA página, inclusive a home) precisa
 * mostrar a cadeira nova com link para a unidade. Usa o currículo REAL
 * (src/conteudo/curriculo.ts), não um currículo sintético: prova que o
 * dado de produção está correto, não só que o componente sabe renderizar
 * um dado de teste inventado.
 */
describe('MenuCurriculo, currículo real, cadeira de Redação Jurídica 1', () => {
  it('mostra as duas cadeiras do 1º período, cada uma com link para sua unidade', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });

    const botaoPeriodo1 = wrapper.findAll('button[aria-expanded]')[0]!;
    await botaoPeriodo1.trigger('click');

    expect(wrapper.text()).toContain('Introdução ao Direito');
    expect(wrapper.text()).toContain('Português e Redação Jurídica 1');

    const botoesCadeira = wrapper.findAll('button[aria-expanded]').slice(1, 3);
    for (const botao of botoesCadeira) await botao.trigger('click');

    const linkRedacao = wrapper
      .findAll('a')
      .find((a) => a.attributes('href') === '/p/p1/redacao-juridica-1/u1');
    expect(
      linkRedacao,
      'link para /p/p1/redacao-juridica-1/u1 não encontrado no menu'
    ).toBeTruthy();

    const linkIntroducao = wrapper
      .findAll('a')
      .find((a) => a.attributes('href') === '/p/p1/intr-direito/u1');
    expect(linkIntroducao, 'link para /p/p1/intr-direito/u1 não encontrado no menu').toBeTruthy();
  });
});
