// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { defineComponent, h, ref } from 'vue';
import App from '@/App.vue';
import {
  CHAVE_AVISO_VERSAO,
  CHAVE_CURRICULO,
  CHAVE_REPOSITORIO,
  CHAVE_SESSAO,
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
 * D-F12-2 (QA-F12): quando a sessão some (401 no clique), o usuário do app vira vazio, e a faixa do
 * aviso não pode sumir junto: a variante "Sua sessão terminou" precisa dela. O controlador já só
 * consulta com login; a faixa só depende de o aviso existir.
 */
const curriculo: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [{ id: 'comum', nome: 'Comum', estado: 'publicado', unidades: [] }]
  }
];
const Pagina = defineComponent({ render: () => h('p', 'pagina') });

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  document.body.innerHTML = '';
});

async function montarSemUsuario() {
  const repo = new RepositorioMemoria();
  const storeModo = criarStoreModoAdaptado(repo);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: Pagina }]
  });
  await router.push('/');
  await router.isReady();
  const sessao = { usuario: ref(''), admin: ref(false), sair: () => undefined };
  const aviso = {
    visaoAgora: () => ({
      versaoPublicada: null,
      nome: '',
      resumo: { rollback: false, foraDoHistorico: false, itens: [], mais: 0 },
      continuaConectado: false,
      avisoQuiz: null
    }),
    consultar: async () => ({ tipo: 'sessao-terminada' as const }),
    fechar: () => undefined,
    marcarRecarregouPara: () => undefined,
    navegarParaInicio: () => undefined
  };
  w = mount(App, {
    attachTo: document.body,
    global: {
      plugins: [router],
      provide: {
        [CHAVE_CURRICULO as unknown as symbol]: curriculo,
        [CHAVE_REPOSITORIO as unknown as symbol]: repo,
        [CHAVE_STORE_TEMA as unknown as symbol]: criarStoreTema(repo),
        [CHAVE_STORE_BUSCA as unknown as symbol]: criarStoreBusca(),
        [CHAVE_STORE_MODO_ADAPTADO as unknown as symbol]: storeModo,
        [CHAVE_SESSAO as unknown as symbol]: sessao,
        [CHAVE_AVISO_VERSAO as unknown as symbol]: aviso
      }
    }
  });
  await flushPromises();
  return { sessao };
}

describe('faixa do aviso com a sessão terminada', () => {
  it('sem usuário a faixa continua montada (a variante de sessão terminada depende dela)', async () => {
    await montarSemUsuario();
    expect(w!.find('.aviso-versao-posicao').exists()).toBe(true);
  });
});
