// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, Teleport } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import LayoutBase from '@/ui/layout/LayoutBase.vue';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';

/**
 * Faixa de topo (pedido do líder, protótipo aprovado): só a página inicial
 * tem a faixa do templo de lado a lado, logo abaixo do cabeçalho e por cima
 * da coluna da barra lateral. Nas outras páginas o layout não muda: a faixa
 * nem existe no DOM. A página preenche a faixa por Teleport para o alvo
 * `#faixa-do-layout`, que fica FORA de <main> (o h1 da home não entra no
 * landmark de conteúdo).
 */
const ALVO = '#faixa-do-layout';

function props(comFaixa: boolean) {
  const repo = new RepositorioMemoria();
  return {
    curriculo: [],
    caminhoAtual: '',
    repositorio: repo,
    storeTema: criarStoreTema(repo),
    storeBusca: criarStoreBusca(),
    storeModoAdaptado: criarStoreModoAdaptado(repo),
    comFaixa
  };
}

/** Página de teste que, como a Home, manda conteúdo para a faixa. */
const PaginaComFaixa = defineComponent({
  setup() {
    return () =>
      h(Teleport, { to: ALVO }, [h('p', { class: 'conteudo-na-faixa' }, 'Faixa da página')]);
  }
});

let montado: VueWrapper | undefined;

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  document.body.innerHTML = '';
});

describe('LayoutBase, faixa de topo', () => {
  it('na rota com faixa, o alvo existe antes da grade lateral+conteúdo e fora de <main>', () => {
    montado = mount(LayoutBase, { props: props(true), attachTo: document.body });
    const alvo = document.querySelector(ALVO);
    const corpo = document.querySelector('.layout-base__corpo');
    expect(alvo).not.toBeNull();
    expect(corpo).not.toBeNull();
    // 4 = Node.DOCUMENT_POSITION_FOLLOWING: o corpo vem depois do alvo no documento.
    expect(alvo!.compareDocumentPosition(corpo!) & 4).toBeTruthy();
    expect(alvo!.closest('main')).toBeNull();
  });

  it('o conteúdo que a página manda para a faixa cai no alvo, fora da coluna principal', () => {
    montado = mount(LayoutBase, {
      props: props(true),
      attachTo: document.body,
      slots: { default: () => h(PaginaComFaixa) }
    });
    const dentroDaFaixa = document.querySelector(`${ALVO} .conteudo-na-faixa`);
    expect(dentroDaFaixa, 'Teleport não levou o conteúdo para a faixa').not.toBeNull();
    expect(dentroDaFaixa!.closest('main')).toBeNull();
  });

  it('em outra rota (sem faixa), o alvo não existe e o layout segue como antes', () => {
    montado = mount(LayoutBase, { props: props(false), attachTo: document.body });
    expect(document.querySelector(ALVO)).toBeNull();
    expect(document.querySelector('.layout-base__corpo--com-faixa')).toBeNull();
  });

  it('com faixa, a grade recebe a classe que prende a barra lateral sob o cabeçalho', () => {
    montado = mount(LayoutBase, { props: props(true), attachTo: document.body });
    expect(document.querySelector('.layout-base__corpo--com-faixa')).not.toBeNull();
  });
});
