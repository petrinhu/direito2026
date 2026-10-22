// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

/**
 * AV3 com grupos (ordem do líder, 22/10/2026): Livro traz um tópico publicado,
 * Material de estudo está em breve. A u1 simples continua igual.
 */
const CONTEUDO_VAZIO: ConteudoUnidade = {
  meta: { estado: 'publicado', titulo: 't', subtitulo: 's', descricao: 'd' },
  resumo: []
};

const curriculo: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      {
        id: 'cadeira',
        nome: 'Cadeira',
        estado: 'publicado',
        grupos: [
          { unidade: 'u3', id: 'livro', rotulo: 'Livro' },
          { unidade: 'u3', id: 'material', rotulo: 'Material de estudo' }
        ],
        unidades: [
          {
            id: 'u1',
            rotulo: 'AV1',
            titulo: 'Unidade simples',
            estado: 'publicado',
            abas: ['resumo'],
            carregar: async () => CONTEUDO_VAZIO
          },
          {
            id: 'u3-livro-topico',
            rotulo: 'AV3',
            titulo: 'Título do tópico',
            estado: 'publicado',
            abas: ['resumo'],
            carregar: async () => CONTEUDO_VAZIO
          }
        ]
      }
    ]
  }
];

async function abrirTudo(wrapper: ReturnType<typeof mount>): Promise<void> {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const fechados = wrapper
      .findAll('button[aria-expanded="false"]')
      .filter((b) => !b.text().includes('Resumo'));
    for (const botao of fechados) await botao.trigger('click');
    await flushPromises();
  }
}

describe('MenuCurriculo: AV com grupos e tópicos', () => {
  it('a AV3 aparece como botão de submenu, fechado no início, e abre ao clicar', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    const av = wrapper.find('button[aria-label="Mostrar submenu de AV3"]');
    expect(av.exists()).toBe(true);
    expect(av.attributes('aria-expanded')).toBe('false');
    await av.trigger('click');
    expect(av.attributes('aria-expanded')).toBe('true');
    expect(wrapper.text()).toContain('Material de estudo');
  });

  it('dentro da AV3: o grupo Livro é botão de submenu e Material de estudo está em breve, sem link', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await abrirTudo(wrapper);
    const livro = wrapper.findAll('button').find((b) => b.text().trim() === 'Livro');
    expect(livro?.attributes('aria-expanded')).toBeDefined();
    const material = wrapper
      .findAll('.estado-em-breve')
      .find((s) => s.text().includes('Material de estudo'));
    expect(material?.exists()).toBe(true);
    expect(wrapper.findAll('a').some((a) => a.text().includes('Material de estudo'))).toBe(false);
  });

  it('dentro de Livro, o tópico publicado é um link para a unidade, com o título dela', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await abrirTudo(wrapper);
    await vi.waitFor(() =>
      expect(wrapper.find('a[href="/p/p1/cadeira/u3-livro-topico"]').exists()).toBe(true)
    );
    expect(wrapper.find('a[href="/p/p1/cadeira/u3-livro-topico"]').text()).toBe('Título do tópico');
  });

  it('a unidade simples u1 continua como antes: link para a unidade com o rótulo AV1', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await abrirTudo(wrapper);
    expect(wrapper.find('a[href="/p/p1/cadeira/u1"]').text()).toBe('AV1');
  });

  it('todos os ids do menu são únicos', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await abrirTudo(wrapper);
    const ids = wrapper.findAll('[id]').map((el) => el.attributes('id'));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
