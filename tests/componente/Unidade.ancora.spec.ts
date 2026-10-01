// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import Unidade from '@/ui/paginas/Unidade.vue';
import { CHAVE_CURRICULO, CHAVE_REPOSITORIO } from '@/app/chaves';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import type { Curriculo } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';
import { mnemonicos } from '@/conteudo/p1/filosofia-juridica/u1/mnemonicos';
import { mapaFichamento } from '@/conteudo/p1/filosofia-juridica/u1/mapaFichamento';
import { resumo } from '@/conteudo/p1/filosofia-juridica/u1/resumo';

/**
 * Bug do líder: "os links dos mnemônicos levam ao topo da página, não ao
 * local correto". O roteador rola até a âncora ANTES de o resumo existir
 * (o conteúdo chega por import dinâmico), então ninguém rolava depois.
 */
const conteudo: ConteudoUnidade = {
  meta: { titulo: 't', subtitulo: 's', descricao: 'd' },
  resumo,
  mnemonicos,
  mapaFichamento
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
        unidades: [
          {
            id: 'u1',
            rotulo: 'Unidade 1',
            titulo: 'T',
            estado: 'publicado',
            abas: ['resumo', 'mnemonicos'],
            carregar: async () => conteudo
          }
        ]
      }
    ]
  }
];

const rolagem = vi.fn();
let original: typeof HTMLElement.prototype.scrollIntoView | undefined;

beforeEach(() => {
  original = HTMLElement.prototype.scrollIntoView;
  HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
    rolagem(this.id);
  };
});
afterEach(() => {
  HTMLElement.prototype.scrollIntoView = original as typeof HTMLElement.prototype.scrollIntoView;
  rolagem.mockClear();
  window.location.hash = '';
  document.body.innerHTML = '';
});

async function montarComHash(hash: string) {
  window.location.hash = hash;
  const wrapper = mount(Unidade, {
    props: { periodo: 'p1', cadeira: 'cadeira', unidade: 'u1', aba: 'resumo' },
    attachTo: document.body,
    global: {
      provide: {
        [CHAVE_CURRICULO as unknown as symbol]: curriculo,
        [CHAVE_REPOSITORIO as unknown as symbol]: new RepositorioMemoria()
      }
    }
  });
  await flushPromises();
  return wrapper;
}

describe('âncora para o bloco do resumo', () => {
  it('toda âncora que os mnemônicos e as fichas usam existe como id no resumo montado', async () => {
    const wrapper = await montarComHash('');
    const alvos = new Set([
      ...mnemonicos.map((m) => m.blocoResumo),
      ...mapaFichamento.pensadores.map((p) => p.blocoResumo)
    ]);
    for (const alvo of alvos) {
      expect(wrapper.find(`#painel-resumo #${alvo}`).exists(), alvo).toBe(true);
    }
  });

  it('depois que o conteúdo chega, rola até o bloco da âncora da URL', async () => {
    await montarComHash('#bloco-8');
    expect(rolagem).toHaveBeenCalledWith('bloco-8');
  });

  it('sem âncora, não rola', async () => {
    await montarComHash('');
    expect(rolagem).not.toHaveBeenCalled();
  });

  it('âncora que não existe na página não quebra nada', async () => {
    await montarComHash('#nao-existe');
    expect(rolagem).not.toHaveBeenCalled();
  });
});
