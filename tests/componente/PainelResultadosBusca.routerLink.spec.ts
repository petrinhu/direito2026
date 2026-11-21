// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { RouterLink } from 'vue-router';
import PainelResultadosBusca from '@/ui/componentes/PainelResultadosBusca.vue';
import type { DocumentoBusca } from '@/core/busca/tipos';
import { roteadorDeTeste } from '../apoio/roteadorDeTeste';

const doc: DocumentoBusca = {
  id: 'p1/intr-direito/u1#bloco-3',
  url: '/p/p1/intr-direito/u1#bloco-3',
  periodo: 'p1',
  cadeira: 'intr-direito',
  unidade: 'u1',
  aba: 'resumo',
  titulo: 'Titulo',
  corpo: 'Titulo',
  trecho: 'trecho'
};

/**
 * Desliga o stub global de RouterLink (tests/apoio/setupVitest.ts) e instala o
 * roteador real de teste: o clique tem que trocar a rota sem recarregar a página.
 */
async function montarComRoteador() {
  await roteadorDeTeste.push('/busca');
  await roteadorDeTeste.isReady();
  return mount(PainelResultadosBusca, {
    props: { resultados: [doc], termo: 't' },
    global: { plugins: [roteadorDeTeste], stubs: { RouterLink: false } },
    attachTo: document.body
  });
}

describe('PainelResultadosBusca, resultado como link interno', () => {
  it('cada resultado é um RouterLink com o destino da url, âncora incluída', async () => {
    const w = await montarComRoteador();

    const link = w.findComponent(RouterLink);

    expect(link.exists()).toBe(true);
    expect(link.props('to')).toBe('/p/p1/intr-direito/u1#bloco-3');
    w.unmount();
  });

  it('clique simples troca a rota dentro do app, sem navegação completa', async () => {
    const w = await montarComRoteador();

    await w.get('a').trigger('click');
    await flushPromises();

    expect(roteadorDeTeste.currentRoute.value.fullPath).toBe('/p/p1/intr-direito/u1#bloco-3');
    w.unmount();
  });

  it('Ctrl+clique deixa o navegador abrir nova aba: o router não intercepta', async () => {
    const w = await montarComRoteador();
    let impedidoPeloRouter: boolean | undefined;
    const registrar = (evento: Event) => {
      impedidoPeloRouter = evento.defaultPrevented;
      evento.preventDefault();
    };
    document.body.addEventListener('click', registrar);

    await w.get('a').trigger('click', { ctrlKey: true });
    await flushPromises();

    document.body.removeEventListener('click', registrar);
    expect(impedidoPeloRouter).toBe(false);
    expect(roteadorDeTeste.currentRoute.value.fullPath).toBe('/busca');
    w.unmount();
  });
});
