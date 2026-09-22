// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BalaoDispositivo from '@/ui/componentes/BalaoDispositivo.vue';
import type { IndiceDispositivos } from '@/core/dispositivos/tipos';

/**
 * Ordem do líder, 22/09/2026, verbatim: "o balao está abrindo num local
 * fixo, não no ponto onde está o mouse [...] Faça o balao aparecer no
 * local atual do cursor do mouse."
 *
 * jsdom não implementa `CSS.supports`, então o caminho de anchor
 * positioning nativo nunca é escolhido nestes testes (a própria feature
 * detection do componente já cai no contorno de @floating-ui/dom) -
 * exatamente o ramo que precisa ser exercitado aqui.
 */

const computePositionMock = vi.fn().mockResolvedValue({ x: 10, y: 20 });

vi.mock('@floating-ui/dom', () => ({
  computePosition: (...args: unknown[]) => computePositionMock(...args),
  offset: () => ({ name: 'offset', fn: () => ({}) }),
  flip: () => ({ name: 'flip', fn: () => ({}) }),
  shift: () => ({ name: 'shift', fn: () => ({}) }),
  size: () => ({ name: 'size', fn: () => ({}) })
}));

function dispararPonteiro(
  alvo: EventTarget,
  tipo: string,
  detalhes: { clientX?: number; clientY?: number } = {}
): void {
  const evento = new Event(tipo, { bubbles: false, cancelable: true });
  Object.assign(evento, {
    pointerType: 'mouse',
    clientX: detalhes.clientX ?? 0,
    clientY: detalhes.clientY ?? 0
  });
  alvo.dispatchEvent(evento);
}

const dispositivos: IndiceDispositivos = {
  'cc-186': {
    id: 'cc-186',
    diploma: 'Código Civil',
    diplomaSigla: 'CC',
    artigo: '186',
    texto: 'Aquele que, por ação ou omissão voluntária...',
    urlFonte: 'https://www.planalto.gov.br/x',
    dataConsulta: '2026-09-21'
  }
};

describe('BalaoDispositivo: posicionamento segue o ponteiro do mouse', () => {
  let regiao: HTMLElement;
  let botao: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '',
        addEventListener: () => {},
        removeEventListener: () => {}
      })
    );
    computePositionMock.mockClear();

    regiao = document.createElement('div');
    botao = document.createElement('button');
    botao.dataset.dispositivo = 'cc-186';
    regiao.appendChild(botao);
    document.body.appendChild(regiao);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('abrir por hover posiciona a partir do ponto do ponteiro, não do botão', async () => {
    const wrapper = mount(BalaoDispositivo, {
      props: { regiao, dispositivos },
      attachTo: document.body
    });
    await wrapper.vm.$nextTick();

    dispararPonteiro(botao, 'pointerenter', { clientX: 555, clientY: 777 });
    await vi.advanceTimersByTimeAsync(120);
    await flushPromises();

    expect(computePositionMock).toHaveBeenCalledTimes(1);
    const referencia = computePositionMock.mock.calls[0]![0] as {
      getBoundingClientRect: () => { x: number; y: number };
    };
    expect(referencia).not.toBe(botao);
    expect(typeof referencia.getBoundingClientRect).toBe('function');
    const rect = referencia.getBoundingClientRect();
    expect(rect.x).toBe(555);
    expect(rect.y).toBe(777);

    // Achado do próprio e2e desta correção: o balão é aplicado com
    // position:fixed (relativo à janela); sem pedir estratégia 'fixed'
    // aqui, computePosition() assume 'absolute' (relativo ao documento,
    // soma o scroll da página) e o resultado nasce fora da tela assim
    // que a página está rolada.
    const opcoes = computePositionMock.mock.calls[0]![2] as { strategy?: string };
    expect(opcoes.strategy).toBe('fixed');

    wrapper.unmount();
  });

  it('abrir por clique (sem ponto do ponteiro) continua posicionando a partir do botão-âncora', async () => {
    const wrapper = mount(BalaoDispositivo, {
      props: { regiao, dispositivos },
      attachTo: document.body
    });
    await wrapper.vm.$nextTick();

    botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();

    expect(computePositionMock).toHaveBeenCalledTimes(1);
    const referencia = computePositionMock.mock.calls[0]![0];
    expect(referencia).toBe(botao);

    wrapper.unmount();
  });
});
