// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { defineComponent, h } from 'vue';
import App from '@/App.vue';
import {
  CHAVE_CURRICULO,
  CHAVE_REPOSITORIO,
  CHAVE_STORE_BUSCA,
  CHAVE_STORE_MODO_ADAPTADO,
  CHAVE_STORE_TEMA
} from '@/app/chaves';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * A Júri mantém o modo adaptado (decisão do CTO de 28/10/2026, pendente de
 * ratificação do líder). O Interdisciplinar continua suspendendo-o (ver
 * App.modoAdaptadoAreaRestrita.spec.ts, que não muda).
 */
const curriculo: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      { id: 'comum', nome: 'Comum', estado: 'publicado', unidades: [] },
      { id: 'secreta', nome: 'Secreta', estado: 'publicado', restrita: true, unidades: [] },
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

const Pagina = defineComponent({ render: () => h('p', 'pagina') });
const BOTAO = '.botao-modo-adaptado';
const atributo = () => document.documentElement.getAttribute('data-modo-adaptado');

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  document.documentElement.removeAttribute('data-modo-adaptado');
  document.body.innerHTML = '';
});

async function montar(inicial: string) {
  const repo = new RepositorioMemoria();
  repo.salvarModoAdaptado(true);
  const storeModo = criarStoreModoAdaptado(repo);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Pagina },
      { path: '/p/:periodo/:cadeira', component: Pagina },
      { path: '/p/:periodo/:cadeira/:resto(.*)', component: Pagina }
    ]
  });
  await router.push(inicial);
  await router.isReady();
  w = mount(App, {
    attachTo: document.body,
    global: {
      plugins: [router],
      provide: {
        [CHAVE_CURRICULO as unknown as symbol]: curriculo,
        [CHAVE_REPOSITORIO as unknown as symbol]: repo,
        [CHAVE_STORE_TEMA as unknown as symbol]: criarStoreTema(repo),
        [CHAVE_STORE_BUSCA as unknown as symbol]: criarStoreBusca(),
        [CHAVE_STORE_MODO_ADAPTADO as unknown as symbol]: storeModo
      }
    }
  });
  await flushPromises();
  return { router, repo, storeModo };
}

describe('modo adaptado e a área da Júri', () => {
  it('na Júri, com o modo ligado: botão presente e atributo on, preferência intacta', async () => {
    const { repo, storeModo } = await montar('/p/p1/juri-simulado');
    expect(w!.find(BOTAO).exists()).toBe(true);
    expect(atributo()).toBe('on');
    expect(storeModo.ativo.value).toBe(true);
    expect(repo.lerModoAdaptado()).toBe(true);
  });

  it('o Interdisciplinar, ao lado, continua suspendendo o modo', async () => {
    await montar('/p/p1/secreta');
    expect(w!.find(BOTAO).exists()).toBe(false);
    expect(atributo()).toBeNull();
  });
});
