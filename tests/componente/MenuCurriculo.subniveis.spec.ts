// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

/**
 * Ordem do líder, 22/09/2026, verbatim: "2- faltou os submenus da 1a
 * unidade: resumo, peticao comentada, quiz" e "3- submenus de resumo, de
 * peticao... e de quiz" (cada um abre mais um nível a partir do dado real
 * da unidade). Este arquivo prova o 4o e 5o nível da árvore: eles só
 * aparecem depois que `unidade.carregar()` resolve, nunca antes (a árvore
 * não pode inventar título de bloco/seção/categoria).
 */
function conteudoDeTeste(): ConteudoUnidade {
  return {
    meta: { titulo: 't', subtitulo: 's', descricao: 'd' },
    resumo: [
      {
        id: 'bloco-0',
        numero: 1,
        titulo: 'Bloco A',
        fonte: 'f',
        corpoHtml: '',
        resumo: [],
        exemploHtml: ''
      },
      {
        id: 'bloco-1',
        numero: 2,
        titulo: 'Bloco B',
        fonte: 'f',
        corpoHtml: '',
        resumo: [],
        exemploHtml: ''
      }
    ],
    peticao: {
      titulo: 'Peça',
      notaHtml: '',
      secoes: [
        { id: 'enderecamento', titulo: 'Endereçamento', corpoHtml: '', comentarioHtml: '' },
        { id: 'qualificacao', titulo: 'Qualificação', corpoHtml: '', comentarioHtml: '' }
      ]
    },
    quiz: [
      {
        id: 1,
        categoria: 'teoria',
        enunciadoHtml: 'e',
        alternativasHtml: ['a', 'b', 'c', 'd'],
        correta: 0,
        fonteExtra: false,
        explicacaoHtml: 'x'
      },
      {
        id: 2,
        categoria: 'teoria',
        enunciadoHtml: 'e',
        alternativasHtml: ['a', 'b', 'c', 'd'],
        correta: 0,
        fonteExtra: false,
        explicacaoHtml: 'x'
      },
      {
        id: 3,
        categoria: 'peticao',
        enunciadoHtml: 'e',
        alternativasHtml: ['a', 'b', 'c', 'd'],
        correta: 0,
        fonteExtra: false,
        explicacaoHtml: 'x'
      }
    ]
  };
}

function curriculoComCarregar(carregar: () => Promise<ConteudoUnidade>): Curriculo {
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
              titulo: 'Unidade 1',
              estado: 'publicado',
              abas: ['resumo', 'peticao', 'quiz'],
              carregar
            }
          ]
        }
      ]
    }
  ];
}

async function abrirAteUnidade(wrapper: ReturnType<typeof mount>) {
  const botaoPeriodo = wrapper.find('button[aria-expanded]');
  await botaoPeriodo.trigger('click');
  const botaoCadeira = wrapper.findAll('button[aria-expanded]')[1]!;
  await botaoCadeira.trigger('click');
}

describe('MenuCurriculo, 4o e 5o nível (submenus de unidade)', () => {
  it('unidade publicada com abas mostra um botão de alternar (toggle) separado do link', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoComCarregar(() => Promise.resolve(conteudoDeTeste())),
        caminhoAtual: ''
      }
    });
    await abrirAteUnidade(wrapper);

    const linkUnidade = wrapper.findAll('a').find((a) => a.text().includes('Unidade 1'));
    expect(linkUnidade!.attributes('href')).toBe('/p/p1/intr-direito/u1');

    const toggleUnidade = wrapper.find('button[aria-label="Mostrar submenu de Unidade 1"]');
    expect(toggleUnidade.exists()).toBe(true);
    expect(toggleUnidade.attributes('aria-expanded')).toBe('false');
  });

  it('não mostra nenhum título de bloco/seção/categoria antes de abrir a unidade', () => {
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoComCarregar(() => Promise.resolve(conteudoDeTeste())),
        caminhoAtual: ''
      }
    });
    const texto = wrapper.text();
    expect(texto).not.toContain('Bloco A');
    expect(texto).not.toContain('Endereçamento');
  });

  it('ao abrir a unidade, carrega o conteúdo e mostra Resumo, Petição comentada e Quiz como grupos', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoComCarregar(() => Promise.resolve(conteudoDeTeste())),
        caminhoAtual: ''
      }
    });
    await abrirAteUnidade(wrapper);
    await wrapper.find('button[aria-label="Mostrar submenu de Unidade 1"]').trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    const texto = wrapper.text();
    expect(texto).toContain('Resumo');
    expect(texto).toContain('Petição comentada');
    expect(texto).toContain('Quiz');
  });

  it('sob Resumo, abre os títulos reais dos blocos com link para a âncora do bloco', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoComCarregar(() => Promise.resolve(conteudoDeTeste())),
        caminhoAtual: ''
      }
    });
    await abrirAteUnidade(wrapper);
    await wrapper.find('button[aria-label="Mostrar submenu de Unidade 1"]').trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    const botaoResumo = wrapper.findAll('button').find((b) => b.text() === 'Resumo');
    expect(botaoResumo).toBeTruthy();
    await botaoResumo!.trigger('click');

    const linkBlocoA = wrapper.findAll('a').find((a) => a.text() === 'Bloco A');
    expect(linkBlocoA).toBeTruthy();
    expect(linkBlocoA!.attributes('href')).toBe('/p/p1/intr-direito/u1#bloco-0');
  });

  it('sob Petição comentada, abre os títulos reais das seções com link para a âncora da seção', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoComCarregar(() => Promise.resolve(conteudoDeTeste())),
        caminhoAtual: ''
      }
    });
    await abrirAteUnidade(wrapper);
    await wrapper.find('button[aria-label="Mostrar submenu de Unidade 1"]').trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    const botaoPeticao = wrapper.findAll('button').find((b) => b.text() === 'Petição comentada');
    await botaoPeticao!.trigger('click');

    const linkSecao = wrapper.findAll('a').find((a) => a.text() === 'Endereçamento');
    expect(linkSecao).toBeTruthy();
    expect(linkSecao!.attributes('href')).toBe('/p/p1/intr-direito/u1/peticao#enderecamento');
  });

  it('Quiz é item final, sem submenu: link direto, sem botão nem seta de abrir', async () => {
    // Ordem do líder, 22/09/2026, verbatim: "quiz nao precisa de
    // submenu". Antes desta ordem, Quiz agrupava por categoria com
    // contagem (5o nível); esse agrupamento foi removido.
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoComCarregar(() => Promise.resolve(conteudoDeTeste())),
        caminhoAtual: ''
      }
    });
    await abrirAteUnidade(wrapper);
    await wrapper.find('button[aria-label="Mostrar submenu de Unidade 1"]').trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();

    // Nenhum botão chamado "Quiz": não há nada para abrir.
    const botaoQuiz = wrapper.findAll('button').find((b) => b.text() === 'Quiz');
    expect(botaoQuiz).toBeUndefined();

    // É um link real, direto para a aba.
    const linkQuiz = wrapper.findAll('a').find((a) => a.text() === 'Quiz');
    expect(linkQuiz).toBeTruthy();
    expect(linkQuiz!.attributes('href')).toBe('/p/p1/intr-direito/u1/quiz');

    // Nenhum resto do agrupamento por categoria que existiu antes.
    const texto = wrapper.text();
    expect(texto).not.toContain('Teoria');
    expect(texto).not.toContain('Fundamentos');
    expect(texto).not.toContain('(2)');
    expect(texto).not.toContain('(1)');
  });

  it('Escape no botão de alternar unidade fecha o nível e devolve o foco', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoComCarregar(() => Promise.resolve(conteudoDeTeste())),
        caminhoAtual: ''
      },
      attachTo: document.body
    });
    await abrirAteUnidade(wrapper);
    const toggleUnidade = wrapper.find('button[aria-label="Mostrar submenu de Unidade 1"]');
    await toggleUnidade.trigger('click');
    expect(toggleUnidade.attributes('aria-expanded')).toBe('true');

    await toggleUnidade.trigger('keydown', { key: 'Escape' });
    expect(toggleUnidade.attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggleUnidade.element);
    wrapper.unmount();
  });

  it('unidade sem carregar() (dado ainda não decorado) não trava nem inventa conteúdo ao expandir', async () => {
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
                abas: ['resumo']
              }
            ]
          }
        ]
      }
    ];
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await abrirAteUnidade(wrapper);
    const toggleUnidade = wrapper.find('button[aria-label="Mostrar submenu de Unidade 1"]');
    await toggleUnidade.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain('Bloco A');
  });

  it('cada nível de profundidade carrega uma classe de nível própria, para indentação e fonte progressivas', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: {
        curriculo: curriculoComCarregar(() => Promise.resolve(conteudoDeTeste())),
        caminhoAtual: ''
      }
    });
    await abrirAteUnidade(wrapper);
    await wrapper.find('button[aria-label="Mostrar submenu de Unidade 1"]').trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    const botaoResumo = wrapper.findAll('button').find((b) => b.text() === 'Resumo');
    await botaoResumo!.trigger('click');

    expect(wrapper.find('[class*="menu-curriculo__nivel-2"]').exists()).toBe(true);
    expect(wrapper.find('[class*="menu-curriculo__nivel-3"]').exists()).toBe(true);
    expect(wrapper.find('[class*="menu-curriculo__nivel-4"]').exists()).toBe(true);
    expect(wrapper.find('[class*="menu-curriculo__nivel-5"]').exists()).toBe(true);
  });
});
