// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import Cadeira from '@/ui/paginas/Cadeira.vue';
import { CHAVE_CLIENTE_JURI, CHAVE_CLIENTE_RESTRITO, CHAVE_CURRICULO } from '@/app/chaves';
import { criarClienteJuri } from '@/app/juri/clienteJuri';
import type { ClienteApi } from '@/app/restrito/clienteApi';
import type { Curriculo } from '@/core/curriculo/tipos';
import { criarServidorJuriFalso } from '../../unidade/apoio/servidorJuriFalso';

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
    sessao: vi.fn(async () => ({ autenticado: false }))
  } as unknown as ClienteApi;
  const servidor = criarServidorJuriFalso();
  const juri = criarClienteJuri({ buscar: servidor.buscar });
  const w = mount(Cadeira, {
    props: { periodo: 'p1', cadeira },
    attachTo: document.body,
    global: {
      provide: {
        [CHAVE_CURRICULO as unknown as symbol]: curriculo,
        [CHAVE_CLIENTE_RESTRITO as unknown as symbol]: restrito,
        [CHAVE_CLIENTE_JURI as unknown as symbol]: juri
      }
    }
  });
  return { w, restrito };
}

describe('Cadeira.vue e a Júri', () => {
  it('a cadeira da Júri abre a própria área, mesmo em breve, e não a área do Interdisciplinar', async () => {
    const { w, restrito } = montar('juri-simulado');
    await vi.waitFor(() => expect(w.find('.area-juri').exists()).toBe(true));
    await flushPromises();
    expect(w.get('h1').text()).toBe('Júri Simulado');
    expect(w.find('.area-restrita').exists()).toBe(false);
    expect(w.find('.pagina-cadeira').exists()).toBe(false);
    expect(restrito.sessao).not.toHaveBeenCalled();
    w.unmount();
  });

  it('o Interdisciplinar continua na própria área, com o cliente dela', async () => {
    const { w, restrito } = montar('interdisciplinar');
    await vi.waitFor(() => expect(w.find('.area-restrita').exists()).toBe(true));
    await flushPromises();
    expect(w.find('.area-juri').exists()).toBe(false);
    expect(restrito.sessao).toHaveBeenCalled();
    w.unmount();
  });
});
