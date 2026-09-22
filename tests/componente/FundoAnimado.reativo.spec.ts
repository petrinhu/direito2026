// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import FundoAnimado from '@/ui/componentes/FundoAnimado.vue';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import type { StoreModoAdaptado } from '@/app/stores/modoAdaptado';

/**
 * Achado 1 da revisão (docs/revisao-modo-adaptado.md): FundoAnimado.vue só
 * checava o modo adaptado uma vez, em onMounted. Ligar o modo com a home já
 * aberta não parava a animação em curso, contrariando docs/modo-adaptado.md
 * §6 ("O modo desliga todo movimento da página"). Este teste liga/desliga o
 * modo DEPOIS de montado (não antes, como os testes e2e existentes fazem) e
 * prova, por chamada real de requestAnimationFrame/cancelAnimationFrame (sem
 * mock de canvas: só getContext é stubado, o resto do componente roda de
 * verdade), que a animação para e retoma ao vivo.
 */
function stubContexto2D(): void {
  const ctxFalso = {
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    fillRect: () => undefined,
    fillStyle: ''
  };
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxFalso) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

function criarStoreFalso(inicial: boolean): StoreModoAdaptado {
  return { ativo: ref(inicial), alternar: vi.fn() };
}

describe('FundoAnimado, reatividade ao modo adaptado', () => {
  beforeEach(() => {
    stubContexto2D();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        // nunca dispara sozinho: cada teste controla o avanço chamando o cb
        return 1;
      })
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }))
    );
  });

  it('para a animação (cancelAnimationFrame) quando o modo adaptado liga com o componente já montado', async () => {
    const store = criarStoreFalso(false);
    mount(FundoAnimado, {
      props: { altura: 280 },
      global: { provide: { [CHAVE_STORE_MODO_ADAPTADO as symbol]: store } }
    });

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    store.ativo.value = true;
    await Promise.resolve();

    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('retoma a animação (novo requestAnimationFrame) quando o modo adaptado desliga ao vivo', async () => {
    const store = criarStoreFalso(true);
    mount(FundoAnimado, {
      props: { altura: 280 },
      global: { provide: { [CHAVE_STORE_MODO_ADAPTADO as symbol]: store } }
    });

    // Nasceu com o modo já ligado: nenhuma animação deve ter começado.
    expect(requestAnimationFrame).not.toHaveBeenCalled();

    store.ativo.value = false;
    await Promise.resolve();

    expect(requestAnimationFrame).toHaveBeenCalled();
  });
});
