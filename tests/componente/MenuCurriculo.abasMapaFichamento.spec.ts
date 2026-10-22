// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import { decorarCurriculo } from '@/app/carregamento/decorarCurriculo';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { curriculo as curriculoSemCarregador } from '@/conteudo/curriculo';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { TextoIntegral } from '@/core/textoIntegral/tipos';

const curriculo = decorarCurriculo(curriculoSemCarregador, CARREGADORES);

/**
 * Ordem do líder, 01/10/2026: as abas novas de Filosofia Jurídica aparecem
 * no menu lateral como as outras, na ordem Resumo, Mapa mental, Fichamento,
 * Mnemônicos, Quiz, e só nessa unidade.
 */
async function abrirTudo(wrapper: ReturnType<typeof mount>): Promise<void> {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const fechados = wrapper
      .findAll('button[aria-expanded="false"]')
      .filter((b) => !b.text().includes('Resumo'));
    for (const botao of fechados) await botao.trigger('click');
    await flushPromises();
  }
}

describe('MenuCurriculo: abas novas de Filosofia Jurídica', () => {
  it('lista Mapa mental, Fichamento e Mnemônicos com link direto, entre Resumo e Quiz', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await abrirTudo(wrapper);
    // O conteúdo da unidade é carregado por import dinâmico: espera chegar.
    await vi.waitFor(() =>
      expect(wrapper.find('a[href="/p/p1/filosofia-juridica/u1/quiz"]').exists()).toBe(true)
    );
    const base = '/p/p1/filosofia-juridica/u1';
    const links = wrapper
      .findAll('a')
      .filter(
        (a) => (a.attributes('href') ?? '').startsWith(`${base}/`) || a.attributes('href') === base
      );
    const abas = links
      .filter((a) =>
        /^\/p\/p1\/filosofia-juridica\/u1(\/(mapa|fichamento|mnemonicos|quiz))?$/.test(
          a.attributes('href')!
        )
      )
      .map((a) => [a.attributes('href'), a.text()]);
    expect(abas).toEqual([
      [base, expect.any(String)],
      [`${base}/mapa`, 'Mapa mental'],
      [`${base}/fichamento`, 'Fichamento'],
      [`${base}/mnemonicos`, 'Mnemônicos'],
      [`${base}/quiz`, 'Quiz']
    ]);
  });

  it('as outras cadeiras não ganham as abas novas no menu', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await abrirTudo(wrapper);
    // Só vale afirmar a ausência depois que o conteúdo das outras cadeiras chegou.
    await vi.waitFor(() => {
      for (const cadeira of ['intr-direito', 'redacao-juridica-1', 'sociologia-juridica']) {
        expect(wrapper.find(`a[href="/p/p1/${cadeira}/u1/quiz"]`).exists(), cadeira).toBe(true);
      }
    });
    for (const cadeira of ['intr-direito', 'redacao-juridica-1', 'sociologia-juridica']) {
      for (const aba of ['mapa', 'fichamento', 'mnemonicos']) {
        expect(
          wrapper.find(`a[href="/p/p1/${cadeira}/u1/${aba}"]`).exists(),
          `${cadeira}/${aba}`
        ).toBe(false);
      }
    }
  });
});

const TEXTO_NO_MENU: TextoIntegral = {
  titulo: 'Título do texto integral',
  fonte: 'Autor, Obra, 2010.',
  blocos: [{ tipo: 'paragrafo', trechos: [{ tipo: 'texto', texto: 'Corpo.' }] }]
};

const curriculoComTextoNoMenu: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      {
        id: 'cadeira',
        nome: 'Cadeira',
        estado: 'publicado',
        unidades: [
          {
            id: 'u1',
            rotulo: 'Unidade 1',
            titulo: 'Com texto integral',
            estado: 'publicado',
            abas: ['resumo', 'texto', 'quiz'],
            carregar: async () => ({
              meta: {
                rotulo: 'Unidade 1',
                estado: 'publicado',
                titulo: 't',
                subtitulo: 's',
                descricao: 'd'
              },
              resumo: [],
              textoIntegral: TEXTO_NO_MENU
            })
          },
          {
            id: 'u2',
            rotulo: 'Unidade 2',
            titulo: 'Sem texto integral',
            estado: 'publicado',
            abas: ['resumo', 'quiz'],
            carregar: async () => ({
              meta: {
                rotulo: 'Unidade 2',
                estado: 'publicado',
                titulo: 't',
                subtitulo: 's',
                descricao: 'd'
              },
              resumo: []
            })
          }
        ]
      }
    ]
  }
];

describe('MenuCurriculo: link Texto integral', () => {
  it('a unidade que declara texto ganha link /texto, antes do quiz', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoComTextoNoMenu, caminhoAtual: '' }
    });
    await abrirTudo(wrapper);
    await vi.waitFor(() =>
      expect(wrapper.find('a[href="/p/p1/cadeira/u1/quiz"]').exists()).toBe(true)
    );
    const linksDaUnidade = wrapper
      .findAll('a')
      .map((a) => [a.attributes('href'), a.text()])
      .filter(([href]) => href?.startsWith('/p/p1/cadeira/u1/'));
    expect(linksDaUnidade).toEqual([
      ['/p/p1/cadeira/u1/texto', 'Texto integral'],
      ['/p/p1/cadeira/u1/quiz', 'Quiz']
    ]);
  });

  it('a unidade que não declara texto não ganha o link', async () => {
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo: curriculoComTextoNoMenu, caminhoAtual: '' }
    });
    await abrirTudo(wrapper);
    await vi.waitFor(() =>
      expect(wrapper.find('a[href="/p/p1/cadeira/u2/quiz"]').exists()).toBe(true)
    );
    expect(wrapper.find('a[href="/p/p1/cadeira/u2/texto"]').exists()).toBe(false);
  });
});
