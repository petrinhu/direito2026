// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import BarraTopo from '@/ui/layout/BarraTopo.vue';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';

/**
 * D-F13-1 e D-F13-2 (QA-F13): a faixa do aviso começa na borda de baixo VISÍVEL do cabeçalho, no
 * mínimo 0. O cabeçalho publica essa borda em --base-visivel-cabecalho em cada rolagem, mudança de
 * tamanho e fim de transição (ao recolher ou ao rolar para fora, a borda desce para 0).
 */
const VARIAVEL = '--base-visivel-cabecalho';

function montar(): VueWrapper {
  const repo = new RepositorioMemoria();
  return mount(BarraTopo, {
    props: {
      curriculo: [],
      caminhoAtual: '',
      storeTema: criarStoreTema(repo),
      storeBusca: criarStoreBusca(),
      storeModoAdaptado: criarStoreModoAdaptado(repo)
    }
  });
}

function bordaDeBaixo(wrapper: VueWrapper, bottom: number): void {
  (wrapper.find('header').element as HTMLElement).getBoundingClientRect = () =>
    ({
      top: bottom - 71,
      bottom,
      left: 0,
      right: 0,
      width: 1280,
      height: 71,
      x: 0,
      y: bottom - 71,
      toJSON: () => ({})
    }) as unknown as globalThis.DOMRect;
}

describe('BarraTopo publica a borda de baixo visível', () => {
  let wrapper: VueWrapper | undefined;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.documentElement.style.removeProperty(VARIAVEL);
  });

  it('com o cabeçalho inteiro na tela, a borda é a base dele', () => {
    wrapper = montar();
    bordaDeBaixo(wrapper, 71);
    window.dispatchEvent(new Event('scroll'));
    expect(document.documentElement.style.getPropertyValue(VARIAVEL)).toBe('71px');
  });

  it('com o cabeçalho recolhido para fora da tela, a borda vale 0 (nunca negativa)', () => {
    wrapper = montar();
    bordaDeBaixo(wrapper, -40);
    window.dispatchEvent(new Event('scroll'));
    expect(document.documentElement.style.getPropertyValue(VARIAVEL)).toBe('0px');
  });

  it('ao desmontar, a variável sai da página', () => {
    wrapper = montar();
    bordaDeBaixo(wrapper, 71);
    window.dispatchEvent(new Event('scroll'));
    wrapper.unmount();
    wrapper = undefined;
    expect(document.documentElement.style.getPropertyValue(VARIAVEL)).toBe('');
  });
});
