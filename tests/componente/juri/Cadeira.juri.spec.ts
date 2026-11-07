// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import Cadeira from '@/ui/paginas/Cadeira.vue';
import { CHAVE_CLIENTE_RESTRITO, CHAVE_CURRICULO } from '@/app/chaves';
import type { ClienteApi } from '@/app/restrito/clienteApi';
import type { Curriculo } from '@/core/curriculo/tipos';

const curriculo: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      {
        id: 'interdisciplinar',
        nome: 'Interdisciplinar',
        estado: 'publicado',
        restrita: true,
        unidades: []
      },
      {
        id: 'juri-simulado',
        nome: 'Júri Simulado',
        estado: 'em-breve',
        restrita: true,
        area: 'juri',
        unidades: []
      }
    ]
  }
];

function montar(cadeira: string) {
  const restrito = {
    obterConteudo: vi.fn(async () => ({})),
    obterConteudoJuri: vi.fn(async () => ({}))
  } as unknown as ClienteApi;
  const w = mount(Cadeira, {
    props: { periodo: 'p1', cadeira },
    attachTo: document.body,
    global: {
      provide: {
        [CHAVE_CURRICULO as unknown as symbol]: curriculo,
        [CHAVE_CLIENTE_RESTRITO as unknown as symbol]: restrito
      }
    }
  });
  return { w, restrito };
}

describe('Cadeira.vue e a Júri', () => {
  it('a cadeira da Júri abre a própria área e pede o conteúdo direto, sem login', async () => {
    const { w, restrito } = montar('juri-simulado');
    await vi.waitFor(() => expect(w.find('.area-juri').exists()).toBe(true));
    await flushPromises();
    expect(w.get('h1').text()).toBe('Júri Simulado');
    expect(w.find('.area-restrita').exists()).toBe(false);
    expect(w.find('.pagina-cadeira').exists()).toBe(false);
    expect(restrito.obterConteudoJuri).toHaveBeenCalledTimes(1);
    expect(restrito.obterConteudo).not.toHaveBeenCalled();
    w.unmount();
  });

  it('o Interdisciplinar continua na própria área, com o cliente dela', async () => {
    const { w, restrito } = montar('interdisciplinar');
    await vi.waitFor(() => expect(w.find('.area-restrita').exists()).toBe(true));
    await flushPromises();
    expect(w.find('.area-juri').exists()).toBe(false);
    expect(restrito.obterConteudo).toHaveBeenCalled();
    w.unmount();
  });
});
