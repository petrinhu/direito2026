// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

/**
 * O caminho da página atual fica aberto no menu (ordem do líder, 22/10/2026:
 * "ele deveria ficar expandido no link específico da página em visualização
 * atual"). Ao abrir uma URL direto, ou ao navegar por abas da página, trilha ou
 * menu, o menu abre a cadeia até o item atual e marca o item com aria-current.
 * Trocar de página só acrescenta ramos abertos: não recolhe o que estava aberto.
 *
 * Rotas sintéticas: a prova é do estado do componente, não de roteador.
 */
const conteudo: ConteudoUnidade = {
  meta: { estado: 'publicado', titulo: 't', subtitulo: 's', descricao: 'd' },
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
        grupos: [{ unidade: 'u3', id: 'livro', rotulo: 'Livro' }],
        unidades: [
          {
            id: 'u1',
            rotulo: 'AV1',
            titulo: 'Unidade 1',
            estado: 'publicado',
            abas: ['resumo', 'peticao', 'quiz'],
            carregar: async () => conteudo
          },
          {
            id: 'u3-livro-topico',
            rotulo: 'AV3',
            titulo: 'Título do tópico',
            estado: 'publicado',
            abas: ['texto', 'resumo', 'quiz'],
            carregar: async () => conteudo
          }
        ]
      }
    ]
  }
];

const TOPICO = 'p/p1/cadeira/u3-livro-topico';

function aberto(wrapper: ReturnType<typeof mount>, seletor: string): boolean {
  return wrapper.find(seletor).attributes('aria-expanded') === 'true';
}

function botaoComTexto(wrapper: ReturnType<typeof mount>, texto: string) {
  return wrapper.findAll('button').find((b) => b.text().trim() === texto)!;
}

function linkComTexto(wrapper: ReturnType<typeof mount>, texto: string) {
  return wrapper.findAll('a').find((a) => a.text().trim() === texto)!;
}

const SETA_PERIODO = 'button[aria-controls="lista-p1"]';
const SETA_CADEIRA = 'button[aria-controls="lista-cadeira"]';
const SETA_TOPICO = 'button[aria-controls="lista-u-p1/cadeira/u3-livro-topico"]';
const SETA_U1 = 'button[aria-controls="lista-u-p1/cadeira/u1"]';

describe('MenuCurriculo: cadeia da página atual fica aberta', () => {
  it('ao abrir a URL de um tópico, a cadeia inteira (período, cadeira, AV3, Livro, tópico) abre sozinha', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: `${TOPICO}/texto` } });
    await flushPromises();
    expect(aberto(wrapper, SETA_PERIODO), 'período').toBe(true);
    expect(aberto(wrapper, SETA_CADEIRA), 'cadeira').toBe(true);
    expect(botaoComTexto(wrapper, 'AV3').attributes('aria-expanded'), 'AV3').toBe('true');
    expect(botaoComTexto(wrapper, 'Livro').attributes('aria-expanded'), 'Livro').toBe('true');
    expect(aberto(wrapper, SETA_TOPICO), 'tópico').toBe(true);
  });

  it('o item da página atual recebe aria-current (aba Texto integral do tópico)', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: `${TOPICO}/texto` } });
    await flushPromises();
    expect(linkComTexto(wrapper, 'Texto integral').attributes('aria-current')).toBe('page');
  });

  it('numa página de Petição, o submenu de Petição comentada abre e o link recebe aria-current', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo, caminhoAtual: 'p/p1/cadeira/u1/peticao' }
    });
    await flushPromises();
    expect(
      wrapper
        .find('button[aria-controls^="lista-peticao-p1/cadeira/u1"]')
        .attributes('aria-expanded')
    ).toBe('true');
    expect(linkComTexto(wrapper, 'Petição comentada').attributes('aria-current')).toBe('page');
  });

  it('na página de Resumo (URL da unidade), o submenu de Resumo abre com os blocos', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: 'p/p1/cadeira/u1' } });
    await flushPromises();
    expect(
      wrapper
        .find('button[aria-controls^="lista-resumo-p1/cadeira/u1"]')
        .attributes('aria-expanded')
    ).toBe('true');
    expect(wrapper.findAll('a').some((a) => a.text() === 'Bloco A')).toBe(true);
  });
});

describe('MenuCurriculo: trocar de página não recolhe o ramo atual', () => {
  it('ao navegar de um tópico para outra unidade, o ramo do tópico continua aberto e o da nova abre', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: `${TOPICO}/texto` } });
    await flushPromises();
    await wrapper.setProps({ caminhoAtual: 'p/p1/cadeira/u1' });
    await flushPromises();
    expect(aberto(wrapper, SETA_PERIODO), 'período continua aberto').toBe(true);
    expect(botaoComTexto(wrapper, 'AV3').attributes('aria-expanded'), 'AV3 continua aberta').toBe(
      'true'
    );
    expect(aberto(wrapper, SETA_TOPICO), 'tópico continua aberto').toBe(true);
    expect(aberto(wrapper, SETA_U1), 'AV1 abre na nova página').toBe(true);
  });

  it('um ramo que o usuário abriu manualmente não fecha ao trocar de página', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await wrapper.find(SETA_PERIODO).trigger('click');
    await wrapper.find(SETA_CADEIRA).trigger('click');
    await wrapper.find(SETA_U1).trigger('click');
    await flushPromises();
    expect(aberto(wrapper, SETA_U1), 'AV1 aberta à mão').toBe(true);
    await wrapper.setProps({ caminhoAtual: `${TOPICO}/texto` });
    await flushPromises();
    expect(aberto(wrapper, SETA_U1), 'AV1, aberta antes, continua aberta').toBe(true);
    expect(aberto(wrapper, SETA_TOPICO), 'tópico abre').toBe(true);
  });
});
