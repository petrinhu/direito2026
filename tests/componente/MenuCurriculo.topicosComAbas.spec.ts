// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';
import { ROTULOS_ABA } from '@/app/curriculo/rotulosAba';

/**
 * Tópicos de grupo (ordem do líder, 22/10/2026: "os tópicos de grupo passam a
 * se comportar como uma unidade com abas"): o rótulo leva à página do tópico,
 * e a seta expande as abas do tópico, na ordem de `unidade.abas` (que já vem
 * em ORDEM_ABAS). Resumo abre os blocos, como nas unidades.
 */
const PAGINA_TOPICO = '/p/p1/cadeira/u3-livro-topico';

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
            titulo: 'Unidade simples',
            estado: 'publicado',
            // Ordem canônica (ORDEM_ABAS): Mapa antes de Petição. O menu segue `abas`.
            abas: ['resumo', 'mapa', 'peticao', 'quiz'],
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

/** Abre período, cadeira, AV3 e o grupo Livro, como um leitor faria. */
async function abrirAteAv3(): Promise<ReturnType<typeof mount>> {
  const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
  await wrapper.find('button[aria-expanded]').trigger('click');
  await wrapper.findAll('button[aria-expanded]')[1]!.trigger('click');
  const botao = (texto: string) =>
    wrapper.findAll('button').find((b) => b.text().trim() === texto)!;
  await botao('AV3').trigger('click');
  await botao('Livro').trigger('click');
  await flushPromises();
  return wrapper;
}

/** Ordem em que aparecem os rótulos de abas/links na árvore (documento). */
function ordemDosRotulos(wrapper: ReturnType<typeof mount>, rotulos: string[]): string[] {
  return wrapper
    .findAll('a, button')
    .map((el) => el.text().trim())
    .filter((texto) => rotulos.includes(texto));
}

describe('MenuCurriculo: tópico de grupo com abas', () => {
  it('o rótulo do tópico é link para a página dele, e a seta é um botão separado', async () => {
    const wrapper = await abrirAteAv3();
    const link = wrapper.findAll('a').find((a) => a.attributes('href') === PAGINA_TOPICO);
    expect(link?.text()).toBe('Título do tópico');
    const seta = wrapper.find(`button[aria-controls="lista-u-p1/cadeira/u3-livro-topico"]`);
    expect(seta.exists(), 'o tópico precisa de botão de seta para as abas').toBe(true);
    expect(seta.attributes('aria-label')).toContain('Título do tópico');
  });

  it('a seta do tópico expande as abas na ordem de unidade.abas: Texto integral antes de Resumo', async () => {
    const wrapper = await abrirAteAv3();
    await wrapper
      .find(`button[aria-controls="lista-u-p1/cadeira/u3-livro-topico"]`)
      .trigger('click');
    await flushPromises();
    const ordem = ordemDosRotulos(wrapper, [
      ROTULOS_ABA.texto,
      ROTULOS_ABA.resumo,
      ROTULOS_ABA.quiz
    ]);
    expect(ordem).toEqual([ROTULOS_ABA.texto, ROTULOS_ABA.resumo, ROTULOS_ABA.quiz]);
    const linkTexto = wrapper.findAll('a').find((a) => a.text() === ROTULOS_ABA.texto);
    expect(linkTexto?.attributes('href')).toBe(`${PAGINA_TOPICO}/texto`);
  });

  it('o Resumo do tópico abre os blocos, com link para a âncora de cada bloco', async () => {
    const wrapper = await abrirAteAv3();
    await wrapper
      .find(`button[aria-controls="lista-u-p1/cadeira/u3-livro-topico"]`)
      .trigger('click');
    await flushPromises();
    await wrapper
      .find('button[aria-controls^="lista-resumo-p1/cadeira/u3-livro-topico"]')
      .trigger('click');
    const bloco = wrapper.findAll('a').find((a) => a.text() === 'Bloco A');
    expect(bloco?.attributes('href')).toBe(`${PAGINA_TOPICO}#bloco-0`);
  });
});

describe('MenuCurriculo: abas de unidade seguem a ordem canônica (ORDEM_ABAS)', () => {
  it('Resumo, Mapa, Petição e Quiz da unidade saem na ordem de unidade.abas (Mapa antes de Petição)', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await wrapper.find('button[aria-expanded]').trigger('click');
    await wrapper.findAll('button[aria-expanded]')[1]!.trigger('click');
    await wrapper.find('button[aria-label="Mostrar submenu de AV1"]').trigger('click');
    await flushPromises();
    const rotulos = [ROTULOS_ABA.resumo, ROTULOS_ABA.mapa, ROTULOS_ABA.peticao, ROTULOS_ABA.quiz];
    expect(ordemDosRotulos(wrapper, rotulos)).toEqual(rotulos);
  });
});

/**
 * Tamanho do tópico e das suas abas (nível 5 da escada): o rótulo da linha, o
 * link de aba e o "em breve" leem --menu-tam-5, como os demais itens de nível 5.
 */
describe('MenuCurriculo: tópico com abas segue a escada do nível 5', () => {
  const fonte = readFileSync(
    resolve(__dirname, '../../src/ui/componentes/MenuCurriculo.vue'),
    'utf-8'
  );
  const estilo = fonte.slice(fonte.indexOf('<style>')).replace(/\/\*[\s\S]*?\*\//g, '');
  const regras = [...estilo.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    seletor: m[1]!.trim(),
    corpo: m[2]!
  }));

  function regraDoTrecho(trecho: string): { seletor: string; corpo: string } | undefined {
    return regras.find((r) => r.seletor.includes(trecho) && /font-size:/.test(r.corpo));
  }

  it.each([
    '.menu-curriculo__nivel-5 > li > .menu-curriculo__linha .menu-curriculo__link-unidade',
    '.menu-curriculo__nivel-5 > li > .menu-curriculo__linha .menu-curriculo__link-aba',
    '.menu-curriculo__nivel-5 > li > .menu-curriculo__linha .estado-em-breve'
  ])('%s usa --menu-tam-5', (trecho) => {
    expect(regraDoTrecho(trecho)?.corpo).toMatch(/font-size:\s*var\(--menu-tam-5\)/);
  });
});
