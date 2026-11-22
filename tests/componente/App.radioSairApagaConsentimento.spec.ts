// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { defineComponent, h, ref } from 'vue';
import App from '@/App.vue';
import {
  CHAVE_AVISO_VERSAO,
  CHAVE_CURRICULO,
  CHAVE_RADIO,
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
import { criarStoreRadio } from '@/app/radio/tocadorRadio';
import { CHAVE_PREFERENCIAS_RADIO, type ArmazenamentoLike } from '@/core/radio/preferencias';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Decisão do líder (21/11): sair apaga o consentimento da rádio. A sessão que vira vazia precisa
 * levar a memória do aviso junto: o próximo login não pode tocar sem perguntar de novo.
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

function armazenamento(): ArmazenamentoLike & { dados: Record<string, string> } {
  const dados: Record<string, string> = {};
  return {
    dados,
    getItem: (chave) => dados[chave] ?? null,
    setItem: (chave, valor) => {
      dados[chave] = valor;
    }
  };
}

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  document.body.innerHTML = '';
});

async function montarComSessao(usuarioInicial: string) {
  const repo = new RepositorioMemoria();
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: Pagina }]
  });
  await router.push('/');
  await router.isReady();
  const memoria = armazenamento();
  const radio = criarStoreRadio(memoria);
  radio.consentir();
  const usuario = ref(usuarioInicial);
  const sessao = { usuario, admin: ref(false), sair: () => undefined };
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
        [CHAVE_STORE_MODO_ADAPTADO as unknown as symbol]: criarStoreModoAdaptado(repo),
        [CHAVE_SESSAO as unknown as symbol]: sessao,
        [CHAVE_AVISO_VERSAO as unknown as symbol]: aviso,
        [CHAVE_RADIO as unknown as symbol]: radio
      }
    }
  });
  await flushPromises();
  return { usuario, radio, memoria };
}

describe('sair da conta apaga o consentimento da rádio', () => {
  it('ao a sessão virar vazia, o consentimento some da memória e da store', async () => {
    const { usuario, radio, memoria } = await montarComSessao('aluno');
    expect(radio.consentidaAtual.value).toBe(true);

    usuario.value = '';
    await flushPromises();

    expect(radio.consentidaAtual.value).toBe(false);
    expect(JSON.parse(memoria.dados[CHAVE_PREFERENCIAS_RADIO] ?? '{}').consentimentos).toEqual([]);
  });
});
