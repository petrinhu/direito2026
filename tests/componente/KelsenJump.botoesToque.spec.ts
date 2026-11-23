// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import JogoKelsenJump from '@/ui/kelsenJump/JogoKelsenJump.vue';

/**
 * KELSEN-JUMP (KJ-BOTOES-CELULAR): o toque no palco não pula. No celular, o pulo e o abaixar são
 * dois botões abaixo do palco. O jogo é trocado por um falso para contar as chamadas.
 */
const { jogoFalso } = vi.hoisted(() => ({
  jogoFalso: { pular: vi.fn(), agachar: vi.fn(), iniciar: vi.fn(), parar: vi.fn() }
}));

vi.mock('@/app/kelsenJump', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/kelsenJump')>()),
  criarJogo: vi.fn(() => jogoFalso)
}));

let montado: VueWrapper | undefined;

/** Finge o navegador: `ativo` diz se a média `(pointer: coarse), (hover: none)` casa, ou seja, se há toque. */
function simularToque(ativo: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: ativo,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {}
  }));
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => null
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  localStorage.clear();
  simularToque(false);
  jogoFalso.pular.mockClear();
  jogoFalso.agachar.mockClear();
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

function montar(): VueWrapper {
  return mount(JogoKelsenJump, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    attachTo: document.body
  });
}

function botaoPular() {
  return montado!.get('button.kj__botao--pular');
}

function botaoAbaixar() {
  return montado!.get('button.kj__botao--abaixar');
}

describe('toque no palco e botões do celular', () => {
  it('o pointerdown no palco NÃO chama pular', async () => {
    montado = montar();
    await montado.get('canvas').trigger('pointerdown');
    expect(jogoFalso.pular).not.toHaveBeenCalled();
  });

  it('o botão Pular chama pular no pointerdown, sem esperar o click', async () => {
    montado = montar();
    await botaoPular().trigger('pointerdown');
    expect(jogoFalso.pular).toHaveBeenCalledTimes(1);
  });

  it('o toque no Pular (pointerdown seguido de click) pula uma vez só', async () => {
    montado = montar();
    await botaoPular().trigger('pointerdown');
    botaoPular().element.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));
    expect(jogoFalso.pular).toHaveBeenCalledTimes(1);
  });

  it('o click sem toque (teclado ou leitor de tela) também pula', () => {
    montado = montar();
    botaoPular().element.dispatchEvent(new MouseEvent('click', { detail: 0, bubbles: true }));
    expect(jogoFalso.pular).toHaveBeenCalledTimes(1);
  });

  it('Abaixar agacha no pointerdown e levanta no pointerup', async () => {
    montado = montar();
    await botaoAbaixar().trigger('pointerdown');
    expect(jogoFalso.agachar).toHaveBeenLastCalledWith(true);
    await botaoAbaixar().trigger('pointerup');
    expect(jogoFalso.agachar).toHaveBeenLastCalledWith(false);
  });

  it('Abaixar levanta no pointercancel, no pointerleave e na perda da captura', async () => {
    montado = montar();
    for (const evento of ['pointercancel', 'pointerleave', 'lostpointercapture']) {
      await botaoAbaixar().trigger('pointerdown');
      expect(jogoFalso.agachar).toHaveBeenLastCalledWith(true);
      await botaoAbaixar().trigger(evento);
      expect(jogoFalso.agachar).toHaveBeenLastCalledWith(false);
    }
  });

  it('Abaixar na tela de espera também inicia a partida, como o espaço', async () => {
    montado = montar();
    await botaoAbaixar().trigger('pointerdown');
    expect(jogoFalso.pular).toHaveBeenCalledTimes(1);
  });

  it('aria-pressed do Abaixar acompanha o estado, inclusive quando vem da seta do teclado', async () => {
    montado = montar();
    expect(botaoAbaixar().attributes('aria-pressed')).toBe('false');
    await botaoAbaixar().trigger('pointerdown');
    expect(botaoAbaixar().attributes('aria-pressed')).toBe('true');
    await botaoAbaixar().trigger('pointerup');
    expect(botaoAbaixar().attributes('aria-pressed')).toBe('false');

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    );
    await montado.vm.$nextTick();
    expect(botaoAbaixar().attributes('aria-pressed')).toBe('true');
    document.body.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true, cancelable: true })
    );
    await montado.vm.$nextTick();
    expect(botaoAbaixar().attributes('aria-pressed')).toBe('false');
  });

  it('no celular, o texto e o aria-label mandam usar os botões', () => {
    simularToque(true);
    montado = montar();
    expect(montado.get('canvas').attributes('aria-label')).toContain(
      'Use os botões Pular e Abaixar'
    );
    expect(montado.get('.kj__instrucao').text()).toContain('Use os botões Pular e Abaixar');
  });

  it('no teclado, o texto segue como antes: espaço pula e seta para baixo abaixa', () => {
    montado = montar();
    expect(montado.get('canvas').attributes('aria-label')).toContain('Espaço pula');
    expect(montado.get('.kj__instrucao').text()).toContain('Espaço pula');
  });
});
