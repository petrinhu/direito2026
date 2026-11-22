// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import JogoKelsenJump from '@/ui/kelsenJump/JogoKelsenJump.vue';

/**
 * KELSEN-JUMP: o teclado é ouvido no documento. O jogo é trocado por um falso para contar as chamadas:
 * pulo, abaixar e a remoção dos listeners ao desmontar.
 */
const { jogoFalso } = vi.hoisted(() => ({
  jogoFalso: { pular: vi.fn(), agachar: vi.fn(), iniciar: vi.fn(), parar: vi.fn() }
}));

vi.mock('@/app/kelsenJump', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/kelsenJump')>()),
  criarJogo: vi.fn(() => jogoFalso)
}));

let montado: VueWrapper | undefined;

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => null
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  localStorage.clear();
  jogoFalso.pular.mockClear();
  jogoFalso.agachar.mockClear();
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  document.body.innerHTML = '';
});

function montar(): VueWrapper {
  return mount(JogoKelsenJump, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    attachTo: document.body
  });
}

function tecla(
  tipo: 'keydown' | 'keyup',
  key: string,
  alvo: EventTarget = document.body,
  repeat = false
): KeyboardEvent {
  const evento = new KeyboardEvent(tipo, { key, bubbles: true, cancelable: true, repeat });
  alvo.dispatchEvent(evento);
  return evento;
}

describe('teclado do Kelsen Jump no documento', () => {
  it('Espaço com o foco no corpo pula e impede a rolagem da página', () => {
    montado = montar();
    const evento = tecla('keydown', ' ');
    expect(jogoFalso.pular).toHaveBeenCalledTimes(1);
    expect(evento.defaultPrevented).toBe(true);
  });

  it('Seta para cima também pula', () => {
    montado = montar();
    tecla('keydown', 'ArrowUp');
    expect(jogoFalso.pular).toHaveBeenCalledTimes(1);
  });

  it('auto-repeat não repete o pulo, mas continua impedindo a rolagem', () => {
    montado = montar();
    tecla('keydown', ' ');
    const repetida = tecla('keydown', ' ', document.body, true);
    expect(jogoFalso.pular).toHaveBeenCalledTimes(1);
    expect(repetida.defaultPrevented).toBe(true);
  });

  it('Seta para baixo abaixa enquanto pressionada e levanta na soltura', () => {
    montado = montar();
    const evento = tecla('keydown', 'ArrowDown');
    expect(jogoFalso.agachar).toHaveBeenLastCalledWith(true);
    expect(evento.defaultPrevented).toBe(true);
    tecla('keyup', 'ArrowDown');
    expect(jogoFalso.agachar).toHaveBeenLastCalledWith(false);
  });

  it('Espaço com o foco num botão não pula e não é impedido (o botão age)', () => {
    montado = montar();
    const botao = document.createElement('button');
    document.body.appendChild(botao);
    botao.focus();
    const evento = tecla('keydown', ' ', botao);
    expect(jogoFalso.pular).not.toHaveBeenCalled();
    expect(evento.defaultPrevented).toBe(false);
  });

  it('Espaço num campo de texto não pula', () => {
    montado = montar();
    const campo = document.createElement('input');
    document.body.appendChild(campo);
    campo.focus();
    tecla('keydown', ' ', campo);
    expect(jogoFalso.pular).not.toHaveBeenCalled();
  });

  it('com um modal aberto, o Espaço não é do jogo', () => {
    montado = montar();
    const modal = document.createElement('dialog');
    modal.setAttribute('open', '');
    document.body.appendChild(modal);
    tecla('keydown', ' ');
    expect(jogoFalso.pular).not.toHaveBeenCalled();
  });

  it('ao desmontar, os listeners saem: o Espaço deixa de chegar ao jogo', () => {
    montado = montar();
    montado.unmount();
    montado = undefined;
    tecla('keydown', ' ');
    tecla('keydown', 'ArrowDown');
    expect(jogoFalso.pular).not.toHaveBeenCalled();
    expect(jogoFalso.agachar).not.toHaveBeenCalled();
  });
});
