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
 * Ordem do líder (05/10/2026): "sem modo adaptado para a pagina do
 * interdisciplinar". Com o modo ligado, a área restrita não muda e o botão
 * não aparece lá; fora dela o modo segue valendo e a preferência salva
 * nunca é apagada.
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
const BOTAO = '.botao-modo-adaptado';
const atributo = () => document.documentElement.getAttribute('data-modo-adaptado');

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

describe('modo adaptado e a área restrita', () => {
  it('fora da área, com o modo ligado: botão presente e atributo no <html>', async () => {
    await montar('/', true);
    expect(w!.find(BOTAO).exists()).toBe(true);
    expect(atributo()).toBe('on');
  });

  it('na cadeira restrita, com o modo ligado: sem botão e sem atributo, preferência intacta', async () => {
    const { repo, storeModo } = await montar('/p/p1/secreta', true);
    expect(w!.find(BOTAO).exists()).toBe(false);
    expect(atributo()).toBeNull();
    expect(storeModo.ativo.value).toBe(true);
    expect(repo.lerModoAdaptado()).toBe(true);
  });

  it('ao sair da área, o botão volta e o resto do site respeita a preferência salva', async () => {
    const { router, repo } = await montar('/p/p1/secreta', true);
    await router.push('/p/p1/comum');
    await flushPromises();
    expect(w!.find(BOTAO).exists()).toBe(true);
    expect(atributo()).toBe('on');
    expect(repo.lerModoAdaptado()).toBe(true);
  });

  it('ao entrar na área vindo de fora, o atributo some na hora', async () => {
    const { router } = await montar('/', true);
    await router.push('/p/p1/secreta');
    await flushPromises();
    expect(w!.find(BOTAO).exists()).toBe(false);
    expect(atributo()).toBeNull();
  });

  it('modo desligado: nada muda em nenhuma rota', async () => {
    const { router } = await montar('/p/p1/secreta', false);
    expect(atributo()).toBeNull();
    await router.push('/');
    await flushPromises();
    expect(atributo()).toBeNull();
    expect(w!.find(BOTAO).exists()).toBe(true);
  });
});
