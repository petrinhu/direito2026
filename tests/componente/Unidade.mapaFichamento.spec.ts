// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import Unidade from '@/ui/paginas/Unidade.vue';
import { CHAVE_CURRICULO, CHAVE_REPOSITORIO } from '@/app/chaves';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import type { ChaveAba, Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';
import { DADOS_SINTETICOS } from '../unidade/apoio/dadosFichamento';

const conteudo: ConteudoUnidade = {
  meta: { titulo: 't', subtitulo: 's', descricao: 'd' },
  resumo: [],
  mapaFichamento: DADOS_SINTETICOS,
  mnemonicos: [
    {
      id: 'um',
      titulo: 'Tema do cartão',
      tecnica: 'frase',
      dica: 'Dica.',
      desafio: 'Desafio.',
      guarda: [
        { termo: 'A', explicacao: 'um' },
        { termo: 'B', explicacao: 'dois' }
      ],
      comoFunciona: 'Porque sim.',
      blocoResumo: 'bloco-0'
    }
  ]
};

const curriculoComAbasNovas: Curriculo = [
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
            titulo: 'Resumo, mapa mental, fichamento, mnemônicos e quiz',
            estado: 'publicado',
            abas: ['resumo', 'mapa', 'fichamento', 'mnemonicos'],
            carregar: async () => conteudo
          }
        ]
      }
    ]
  }
];

async function montar(aba: ChaveAba) {
  const wrapper = mount(Unidade, {
    props: { periodo: 'p1', cadeira: 'cadeira', unidade: 'u1', aba },
    global: {
      provide: {
        [CHAVE_CURRICULO as unknown as symbol]: curriculoComAbasNovas,
        [CHAVE_REPOSITORIO as unknown as symbol]: new RepositorioMemoria()
      }
    }
  });
  await flushPromises();
  return wrapper;
}

describe('Unidade com mapa, fichamento e mnemônicos', () => {
  it('oferece as abas na ordem do currículo, com os rótulos novos', async () => {
    const wrapper = await montar('mapa');
    expect(wrapper.findAll('[role="tab"]').map((a) => a.text())).toEqual([
      'Resumo',
      'Mapa mental',
      'Fichamento',
      'Mnemônicos'
    ]);
  });

  it('cada painel mostra só o conteúdo da própria aba', async () => {
    const wrapper = await montar('mapa');
    expect(wrapper.find('#painel-mapa .mapa-visual').exists()).toBe(true);
    expect(wrapper.find('#painel-fichamento .fichamento').exists()).toBe(true);
    expect(wrapper.find('#painel-mnemonicos .mnemonicos').exists()).toBe(true);
    expect(wrapper.find('#painel-mapa .fichamento').exists()).toBe(false);
    expect(wrapper.find('#painel-resumo [role="tree"]').exists()).toBe(false);
  });

  it('a aba ativa é a da rota, e as outras ficam escondidas', async () => {
    const wrapper = await montar('fichamento');
    expect(wrapper.find('[role="tab"][aria-selected="true"]').text()).toBe('Fichamento');
    expect(wrapper.find('#painel-fichamento').isVisible()).toBe(true);
    expect(wrapper.find('#painel-mapa').isVisible()).toBe(false);
  });

  it('os links do mapa e das fichas usam o endereço da unidade', async () => {
    const wrapper = await montar('mapa');
    await wrapper.find('#painel-mapa button.mapa-mental__modo').trigger('click');
    expect(wrapper.find('a[href="/p/p1/cadeira/u1/fichamento#ficha-alfa"]').exists()).toBe(true);
    expect(wrapper.find('a[href="/p/p1/cadeira/u1#bloco-0"]').exists()).toBe(true);
  });
});
