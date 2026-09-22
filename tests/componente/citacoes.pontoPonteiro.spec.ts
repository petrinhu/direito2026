// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarControladorCitacoes } from '@/ui/componentes/citacoes';

/**
 * Ordem do líder, 22/09/2026, verbatim: "o balao está abrindo num local
 * fixo, não no ponto onde está o mouse [...] Faça o balao aparecer no
 * local atual do cursor do mouse."
 *
 * O controlador passa a repassar, na abertura por hover, o ponto
 * (clientX/clientY) de onde o ponteiro entrou, para BalaoDispositivo.vue
 * usar como referência de posicionamento em vez do botão inteiro. Abrir
 * por clique/toque/teclado continua âncorado ao próprio elemento, porque
 * não existe "ponto do ponteiro" nesses casos.
 */

function dispararPonteiro(
  alvo: EventTarget,
  tipo: string,
  detalhes: { pointerType?: string; clientX?: number; clientY?: number } = {}
): void {
  const evento = new Event(tipo, { bubbles: false, cancelable: true });
  Object.assign(evento, {
    pointerType: detalhes.pointerType ?? 'mouse',
    clientX: detalhes.clientX ?? 0,
    clientY: detalhes.clientY ?? 0
  });
  alvo.dispatchEvent(evento);
}

describe('criarControladorCitacoes: ponto do ponteiro repassado à abertura', () => {
  let regiao: HTMLElement;
  let botao: HTMLElement;
  let aoAbrir: ReturnType<typeof vi.fn>;
  let aoFechar: ReturnType<typeof vi.fn>;

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

    regiao = document.createElement('div');
    botao = document.createElement('button');
    botao.dataset.dispositivo = 'cc-186';
    regiao.appendChild(botao);
    document.body.appendChild(regiao);

    aoAbrir = vi.fn();
    aoFechar = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('abrir por hover repassa as coordenadas do ponteiro no instante da entrada', () => {
    const controlador = criarControladorCitacoes({
      dispositivos: () => undefined,
      aoAbrir,
      aoFechar
    });
    controlador.ligar(regiao);

    dispararPonteiro(botao, 'pointerenter', { clientX: 321, clientY: 654 });
    vi.advanceTimersByTime(120);

    expect(aoAbrir).toHaveBeenCalledWith('cc-186', botao, { x: 321, y: 654 });
  });

  it('abrir por clique não informa ponto do ponteiro (mantém âncora no elemento)', () => {
    const controlador = criarControladorCitacoes({
      dispositivos: () => undefined,
      aoAbrir,
      aoFechar
    });
    controlador.ligar(regiao);

    botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(aoAbrir).toHaveBeenCalledWith('cc-186', botao, undefined);
  });
});
