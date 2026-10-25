// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';
import { ROTULOS_ABA } from '@/app/curriculo/rotulosAba';

/**
 * Grupo direto (ordem do líder, 25/10/2026: "Em sociologia, AV3, no menu... Artigos
 * e ECA digital"): o grupo com `direto: true` não tem submenu. O único tópico dele
 * aparece na AV no lugar do grupo, com o rótulo do grupo, link para a página do
 * tópico e seta que abre as abas. Grupo direto sem tópico mostra "em breve" com o
 * rótulo do grupo. Grupo sem a marca segue com os três níveis (regressão da Introdução).
 */
const PAGINA_ARTIGO = '/p/p1/cadeira/u3-artigos-infancia';
const SETA_ARTIGO = 'button[aria-controls="lista-u-p1/cadeira/u3-artigos-infancia"]';

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
        grupos: [
          { unidade: 'u3', id: 'artigos', rotulo: 'Artigos', direto: true },
          { unidade: 'u3', id: 'eca', rotulo: 'ECA Digital', direto: true },
          { unidade: 'u3', id: 'livro', rotulo: 'Livro' }
        ],
        unidades: [
          {
            id: 'u3-artigos-infancia',
            rotulo: 'AV3',
            titulo: 'Título do artigo',
            estado: 'publicado',
            abas: ['texto', 'resumo', 'quiz'],
            carregar: async () => conteudo
          },
          {
            id: 'u3-livro-topico',
            rotulo: 'AV3',
            titulo: 'Título do livro',
            estado: 'publicado',
            abas: ['resumo'],
            carregar: async () => conteudo
          }
        ]
      }
    ]
  }
];

/** Abre período, cadeira e AV3, como um leitor faria. */
async function abrirAv3(): Promise<ReturnType<typeof mount>> {
  const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
  await wrapper.find('button[aria-expanded]').trigger('click');
  await wrapper.findAll('button[aria-expanded]')[1]!.trigger('click');
  await wrapper
    .findAll('button')
    .find((b) => b.text().trim() === 'AV3')!
    .trigger('click');
  await flushPromises();
  return wrapper;
}

describe('MenuCurriculo: item direto da AV', () => {
  it('não há botão de submenu com o rótulo do grupo direto na lista da AV', async () => {
    const wrapper = await abrirAv3();
    const botaoDoGrupo = wrapper.findAll('button').find((b) => b.text().trim() === 'Artigos');
    expect(botaoDoGrupo).toBeUndefined();
    expect(wrapper.find('button[aria-controls="lista-g-g-p1/cadeira/av-3-artigos"]').exists()).toBe(
      false
    );
  });

  it('o rótulo do grupo é link para a página do tópico', async () => {
    const wrapper = await abrirAv3();
    const link = wrapper.findAll('a').find((a) => a.attributes('href') === PAGINA_ARTIGO);
    expect(link?.text()).toBe('Artigos');
  });

  it('a seta do item direto tem aria-expanded e abre as abas do tópico', async () => {
    const wrapper = await abrirAv3();
    const seta = wrapper.find(SETA_ARTIGO);
    expect(seta.attributes('aria-expanded')).toBe('false');
    await seta.trigger('click');
    await flushPromises();
    expect(wrapper.find(SETA_ARTIGO).attributes('aria-expanded')).toBe('true');
    // A seta fica na lista da AV (nível 4), não dentro de um submenu de grupo (nível 5).
    const listaDaSeta = wrapper.find(SETA_ARTIGO).element.closest('ul');
    expect(listaDaSeta?.classList.contains('menu-curriculo__nivel-4')).toBe(true);
    const linkTexto = wrapper.findAll('a').find((a) => a.text() === ROTULOS_ABA.texto);
    expect(linkTexto?.attributes('href')).toBe(`${PAGINA_ARTIGO}/texto`);
  });

  it('grupo direto sem tópico mostra "em breve" com o rótulo do grupo', async () => {
    const wrapper = await abrirAv3();
    const emBreve = wrapper
      .findAll('.estado-em-breve')
      .find((e) => e.text().includes('ECA Digital'));
    expect(emBreve).toBeDefined();
  });

  it('grupo sem a marca direto segue com três níveis: botão do grupo e submenu de tópicos', async () => {
    const wrapper = await abrirAv3();
    const botaoLivro = wrapper.findAll('button').find((b) => b.text().trim() === 'Livro');
    expect(botaoLivro?.attributes('aria-expanded')).toBe('false');
    expect(botaoLivro?.attributes('aria-controls')).toBe('lista-g-g-p1/cadeira/av-3-livro');
  });

  it('nenhum li fica direto dentro de outro li, sem um ul no meio', async () => {
    const wrapper = await abrirAv3();
    expect(wrapper.findAll('li > li')).toHaveLength(0);
  });
});
