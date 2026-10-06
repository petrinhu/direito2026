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
 * O aviso de armazenamento ("não usa cookies ... não envia nada para nenhum
 * servidor") é falso na área restrita (cookie de sessão e API) e cobria o
 * login na primeira visita: lá ele não aparece; no resto do site continua.
 */
const curriculo: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      { id: 'comum', nome: 'Comum', estado: 'publicado', unidades: [] },
      { id: 'secreta', nome: 'Secreta', estado: 'publicado', restrita: true, unidades: [] }
    ]
  }
];

const Pagina = defineComponent({ render: () => h('p', 'pagina') });
const AVISO = '.aviso-armazenamento';

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  document.documentElement.removeAttribute('data-modo-adaptado');
  document.body.innerHTML = '';
});

async function montar(inicial: string, ligado: boolean) {
  const repo = new RepositorioMemoria();
  repo.salvarModoAdaptado(ligado);
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

describe('aviso de armazenamento e a área restrita', () => {
  it('fora da área, na primeira visita: o aviso aparece', async () => {
    await montar('/', false);
    expect(w!.find(AVISO).exists()).toBe(true);
  });

  it('na cadeira restrita, na primeira visita: o aviso não aparece', async () => {
    await montar('/p/p1/secreta', false);
    expect(w!.find(AVISO).exists()).toBe(false);
  });

  it('abaixo da cadeira restrita também não aparece', async () => {
    await montar('/p/p1/secreta/qualquer', false);
    expect(w!.find(AVISO).exists()).toBe(false);
  });

  it('entrar na área tira o aviso; sair dela traz de volta (ainda não visto)', async () => {
    const { router, repo } = await montar('/', false);
    await router.push('/p/p1/secreta');
    await flushPromises();
    expect(w!.find(AVISO).exists()).toBe(false);
    await router.push('/p/p1/comum');
    await flushPromises();
    expect(w!.find(AVISO).exists()).toBe(true);
    expect(repo.lerAvisoArmazenamentoVisto()).toBe(false);
  });
});
