// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import JogoKelsenJump from '@/ui/kelsenJump/JogoKelsenJump.vue';

/**
 * KELSEN-JUMP: o botão de som é um ícone SVG com nome acessível que muda com o estado, e continua
 * com o rótulo de ação (sem aria-pressed, para não anunciar duas vezes). O canvas não existe no jsdom, então o desenho é desligado.
 */
let montado: VueWrapper | undefined;

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => null
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  localStorage.clear();
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
});

describe('botão de som do Kelsen Jump', () => {
  it('começa com o som ligado: nome "Desligar o som", sem aria-pressed, ícone sem texto visível', () => {
    montado = mount(JogoKelsenJump, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
      attachTo: document.body
    });
    const botao = montado.get('button.kj__mudo');
    expect(botao.attributes('aria-label')).toBe('Desligar o som');
    expect(botao.attributes('aria-pressed')).toBeUndefined();
    expect(botao.classes()).not.toContain('kj__mudo--mudo');
    expect(botao.text()).toBe('');
    expect(botao.find('svg').attributes('aria-hidden')).toBe('true');
  });

  it('ao clicar, vira mudo: nome "Ligar o som", classe de mudo, sem aria-pressed, e grava a escolha', async () => {
    montado = mount(JogoKelsenJump, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
      attachTo: document.body
    });
    await montado.get('button.kj__mudo').trigger('click');
    const botao = montado.get('button.kj__mudo');
    expect(botao.attributes('aria-label')).toBe('Ligar o som');
    expect(botao.attributes('aria-pressed')).toBeUndefined();
    expect(botao.classes()).toContain('kj__mudo--mudo');
    expect(localStorage.getItem('caderno-direito:v1:kelsen-jump:mudo')).toBe('1');
  });
});
