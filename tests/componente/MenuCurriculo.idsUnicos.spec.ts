// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

/**
 * Achado do QA (docs/qa-redacao-u1.md, 23/09/2026): com duas cadeiras
 * publicadas no mesmo período, cada uma com uma unidade 'u1', o menu
 * gerava o MESMO id de lista (`lista-u-u1`) duas vezes — HTML inválido, e
 * `aria-controls` de uma cadeira podia apontar para a lista da outra. A
 * causa raiz é mais ampla que a linha apontada pelo QA: todo id/aria-
 * controls do 4o e 5o nível (lista-u-, lista-resumo-, lista-peticao-)
 * era montado só com `unidade.id`, nunca com o caminho inteiro
 * (período/cadeira/unidade). Este teste cobre as duas cadeiras reais do
 * projeto (mesmo padrão de nomes) para não voltar a quebrar por engano.
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
      }
    ],
    peticao: {
      titulo: 'Peça',
      notaHtml: '',
      secoes: [{ id: 'enderecamento', titulo: 'Endereçamento', corpoHtml: '', comentarioHtml: '' }]
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
      }
    ]
  };
}

function curriculoComDuasCadeirasMesmaUnidade(): Curriculo {
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
              carregar: () => Promise.resolve(conteudoDeTeste())
            }
          ]
        },
        {
          id: 'redacao-juridica-1',
          nome: 'Português e Redação Jurídica 1',
          estado: 'publicado',
          unidades: [
            {
              id: 'u1',
              rotulo: 'Unidade 1',
              titulo: 'Unidade 1',
              estado: 'publicado',
              abas: ['resumo', 'peticao', 'quiz'],
              carregar: () => Promise.resolve(conteudoDeTeste())
            }
          ]
        }
      ]
    }
  ];
}

function todosOsIds(html: string): string[] {
  return [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
}

function idsDuplicados(ids: string[]): string[] {
  const contagem = new Map<string, number>();
  for (const id of ids) contagem.set(id, (contagem.get(id) ?? 0) + 1);
  return [...contagem.entries()].filter(([, n]) => n > 1).map(([id]) => id);
}

describe('MenuCurriculo, ids únicos entre cadeiras com a mesma unidade', () => {
  it('expandir as duas cadeiras não duplica o id da lista de unidade (nível 4)', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoComDuasCadeirasMesmaUnidade(), caminhoAtual: '' }
    });
    const botaoPeriodo = wrapper.find('button[aria-expanded]');
    await botaoPeriodo.trigger('click');
    const botoesCadeira = wrapper.findAll('button[aria-expanded]').slice(1, 3);
    for (const botao of botoesCadeira) await botao.trigger('click');

    const duplicados = idsDuplicados(todosOsIds(wrapper.html()));
    expect(duplicados).toEqual([]);
  });

  it('cada toggle de unidade tem aria-controls apontando para um id que existe e é só dela', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoComDuasCadeirasMesmaUnidade(), caminhoAtual: '' }
    });
    const botaoPeriodo = wrapper.find('button[aria-expanded]');
    await botaoPeriodo.trigger('click');
    const botoesCadeira = wrapper.findAll('button[aria-expanded]').slice(1, 3);
    for (const botao of botoesCadeira) await botao.trigger('click');

    const togglesUnidade = wrapper.findAll('button[aria-label="Mostrar submenu de Unidade 1"]');
    expect(togglesUnidade).toHaveLength(2);
    const controlados = togglesUnidade.map((t) => t.attributes('aria-controls')!);
    expect(new Set(controlados).size).toBe(2); // os dois apontam para listas DIFERENTES
    for (const idAlvo of controlados) {
      // Não usa seletor CSS `#id` (o id contém '/', caractere válido em
      // HTML mas que quebra a sintaxe de seletor CSS); atributo exato
      // é o equivalente correto de getElementById aqui.
      expect(wrapper.find(`[id="${idAlvo}"]`).exists()).toBe(true);
    }
  });

  it('abrir o submenu de resumo/petição das duas unidades não duplica id de nível 5', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoComDuasCadeirasMesmaUnidade(), caminhoAtual: '' }
    });
    const botaoPeriodo = wrapper.find('button[aria-expanded]');
    await botaoPeriodo.trigger('click');
    const botoesCadeira = wrapper.findAll('button[aria-expanded]').slice(1, 3);
    for (const botao of botoesCadeira) await botao.trigger('click');

    const togglesUnidade = wrapper.findAll('button[aria-label="Mostrar submenu de Unidade 1"]');
    for (const toggle of togglesUnidade) await toggle.trigger('click');
    await wrapper.vm.$nextTick();
    await new Promise((r) => setTimeout(r, 0)); // deixa a promise de `carregar()` resolver
    await wrapper.vm.$nextTick();

    const duplicados = idsDuplicados(todosOsIds(wrapper.html()));
    expect(duplicados).toEqual([]);
  });
});
