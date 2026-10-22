// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

/**
 * Resumo e Petição comentada são páginas (Resumo = a URL da unidade; Petição =
 * /peticao). Ordem do líder (22/10/2026): "o que for link abre o frame e o que
 * for menu, expande". Então o rótulo é link que navega, e a seta, num botão
 * separado, expande os blocos ou as seções, igual à unidade com abas.
 */
function conteudoDeTeste(): ConteudoUnidade {
  return {
    meta: { rotulo: 'Unidade 1', estado: 'publicado', titulo: 't', subtitulo: 's', descricao: 'd' },
    resumo: [
      {
        id: 'bloco-0',
        numero: 1,
        titulo: 'Bloco A',
        fonte: 'f',
        corpoHtml: '',
        resumo: [],
        exemploHtml: ''
      }
    ],
    peticao: {
      titulo: 'Peça',
      notaHtml: '',
      secoes: [{ id: 'enderecamento', titulo: 'Endereçamento', corpoHtml: '', comentarioHtml: '' }]
    },
    quiz: []
  };
}

const curriculo: Curriculo = [
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
            titulo: 'Unidade 1',
            estado: 'publicado',
            abas: ['resumo', 'peticao'],
            carregar: () => Promise.resolve(conteudoDeTeste())
          }
        ]
      }
    ]
  }
];

/** v-show grava display:none inline; isVisible() do VTU exige o wrapper anexado. */
function estaVisivel(alvo: { element: object }): boolean {
  return (alvo.element as HTMLElement).style.display !== 'none';
}

async function montarComUnidadeAberta() {
  const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
  await wrapper.find('button[aria-expanded]').trigger('click');
  await wrapper.findAll('button[aria-expanded]')[1]!.trigger('click');
  await wrapper.find('button[aria-label="Mostrar submenu de Unidade 1"]').trigger('click');
  await flushPromises();
  return wrapper;
}

describe('MenuCurriculo: Resumo navega pelo rótulo e expande pela seta', () => {
  it('o rótulo Resumo é link para a unidade (página), não botão', async () => {
    const wrapper = await montarComUnidadeAberta();
    const link = wrapper.findAll('a').find((a) => a.text() === 'Resumo');
    expect(link, 'Resumo precisa ser link para a página').toBeDefined();
    expect(link!.attributes('href')).toBe('/p/p1/intr-direito/u1');
  });

  it('a seta do Resumo é um botão separado, com nome acessível, que expande os blocos', async () => {
    const wrapper = await montarComUnidadeAberta();
    const seta = wrapper.find('button[aria-controls^="lista-resumo-"]');
    expect(seta.exists()).toBe(true);
    expect(seta.attributes('aria-label')).toContain('Resumo');
    expect(seta.attributes('aria-expanded')).toBe('false');
    const blocos = wrapper.find('ul[id^="lista-resumo-"]');
    expect(estaVisivel(blocos)).toBe(false);
    await seta.trigger('click');
    expect(seta.attributes('aria-expanded')).toBe('true');
    expect(estaVisivel(blocos)).toBe(true);
    expect(wrapper.findAll('a').some((a) => a.text() === 'Bloco A')).toBe(true);
  });
});

describe('MenuCurriculo: Petição comentada navega pelo rótulo e expande pela seta', () => {
  it('o rótulo Petição comentada é link para /peticao, não botão', async () => {
    const wrapper = await montarComUnidadeAberta();
    const link = wrapper.findAll('a').find((a) => a.text() === 'Petição comentada');
    expect(link, 'Petição comentada precisa ser link para a página').toBeDefined();
    expect(link!.attributes('href')).toBe('/p/p1/intr-direito/u1/peticao');
  });

  it('a seta da Petição é um botão separado, com nome acessível, que expande as seções', async () => {
    const wrapper = await montarComUnidadeAberta();
    const seta = wrapper.find('button[aria-controls^="lista-peticao-"]');
    expect(seta.exists()).toBe(true);
    expect(seta.attributes('aria-label')).toContain('Petição comentada');
    await seta.trigger('click');
    expect(seta.attributes('aria-expanded')).toBe('true');
    expect(wrapper.findAll('a').some((a) => a.text() === 'Endereçamento')).toBe(true);
  });
});
