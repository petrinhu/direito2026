// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import JogoKelsenJump from '@/ui/kelsenJump/JogoKelsenJump.vue';
import { ALTURA_PLACAR, CHAO_TELA } from '@/ui/kelsenJump/desenhar';
import { apexDoSalto, KELSEN } from '@/core/kelsenJump';

/**
 * KELSEN-JUMP: o recorde guardado aparece no texto para o leitor de tela (que muda só no fim da
 * partida). Não há mais o "Pontuação: N" visível no HTML: o placar é desenhado no canvas.
 */
let montado: VueWrapper | undefined;
const CHAVE = 'caderno-direito:v1:kelsen-jump:recorde';

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

function montar(): VueWrapper {
  return mount(JogoKelsenJump, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    attachTo: document.body
  });
}

describe('recorde do Kelsen Jump na tela', () => {
  it('o texto para o leitor de tela traz o recorde guardado no navegador', () => {
    localStorage.setItem(CHAVE, '137');
    montado = montar();
    expect(montado.get('[data-recorde-leitor]').text()).toBe('Recorde: 137.');
  });

  it('sem recorde guardado, o texto traz 0', () => {
    montado = montar();
    expect(montado.get('[data-recorde-leitor]').text()).toBe('Recorde: 0.');
  });

  it('não há mais o "Pontuação:" visível no HTML abaixo do jogo', () => {
    montado = montar();
    expect(montado.text()).not.toContain('Pontuação:');
    expect(montado.find('[data-pontuacao]').exists()).toBe(false);
  });

  it('o placar do canto fica acima do ponto mais alto que um corpo ou obstáculo alcança', () => {
    const topoMaisAlto = CHAO_TELA - (apexDoSalto() + KELSEN.alturaEmPe);
    expect(ALTURA_PLACAR).toBeLessThan(topoMaisAlto);
  });
});
