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
      { id: 'comum', nome: 'Cadeira Comum', estado: 'publicado', unidades: [] },
      { id: 'secreta', nome: 'Cadeira Secreta', estado: 'publicado', restrita: true, unidades: [] }
    ]
  }
];

const cliente = {
  sessao: vi.fn(async () => ({ autenticado: false }))
} as unknown as ClienteApi;

function montar(cadeira: string) {
  return mount(Cadeira, {
    props: { periodo: 'p1', cadeira },
    global: {
      provide: {
        [CHAVE_CURRICULO as unknown as symbol]: curriculo,
        [CHAVE_CLIENTE_RESTRITO as unknown as symbol]: cliente
      }
    }
  });
}

describe('Cadeira.vue e a cadeira restrita', () => {
  it('a cadeira restrita abre a área restrita (login), não a lista de unidades', async () => {
    const w = montar('secreta');
    await vi.waitFor(() => expect(w.find('.area-restrita').exists()).toBe(true));
    await flushPromises();
    expect(w.get('h1').text()).toBe('Área restrita ao grupo Fronteiras da Inteligência Artificial');
    expect(w.find('.pagina-cadeira').exists()).toBe(false);
  });

  it('a cadeira comum continua com a lista de unidades', async () => {
    const w = montar('comum');
    await flushPromises();
    expect(w.get('h1').text()).toBe('Cadeira Comum');
    expect(w.find('.area-restrita').exists()).toBe(false);
  });
});
