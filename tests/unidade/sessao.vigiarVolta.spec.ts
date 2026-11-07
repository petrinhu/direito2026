import { describe, expect, it, vi } from 'vitest';
import { vigiarVolta, type FonteVolta } from '@/app/sessao/vigiarVolta';

function criarFonteFalsa() {
  const callbacks: { mostrar?: (vinDoCache: boolean) => void; visivel?: () => void } = {};
  const cancelarMostrar = vi.fn();
  const cancelarVisivel = vi.fn();
  const fonte: FonteVolta = {
    aoMostrarPagina(callback) {
      callbacks.mostrar = callback;
      return cancelarMostrar;
    },
    aoFicarVisivel(callback) {
      callbacks.visivel = callback;
      return cancelarVisivel;
    }
  };
  return { fonte, callbacks, cancelarMostrar, cancelarVisivel };
}

describe('vigiarVolta (2.2: pageshow e aba que volta)', () => {
  it('página restaurada do cache do navegador (persisted) recarrega, para o botão Voltar depois de sair não mostrar o app', () => {
    const { fonte, callbacks } = criarFonteFalsa();
    const recarregar = vi.fn();
    vigiarVolta(fonte, { recarregar, conferir: vi.fn() });

    callbacks.mostrar?.(true);

    expect(recarregar).toHaveBeenCalledOnce();
  });

  it('página mostrada sem vir do cache não recarrega', () => {
    const { fonte, callbacks } = criarFonteFalsa();
    const recarregar = vi.fn();
    vigiarVolta(fonte, { recarregar, conferir: vi.fn() });

    callbacks.mostrar?.(false);

    expect(recarregar).not.toHaveBeenCalled();
  });

  it('aba que volta a ficar visível pede a conferência de sessão', () => {
    const { fonte, callbacks } = criarFonteFalsa();
    const conferir = vi.fn();
    vigiarVolta(fonte, { recarregar: vi.fn(), conferir });

    callbacks.visivel?.();

    expect(conferir).toHaveBeenCalledOnce();
  });

  it('a função devolvida desliga as duas assinaturas', () => {
    const { fonte, cancelarMostrar, cancelarVisivel } = criarFonteFalsa();
    const parar = vigiarVolta(fonte, { recarregar: vi.fn(), conferir: vi.fn() });

    parar();

    expect(cancelarMostrar).toHaveBeenCalledOnce();
    expect(cancelarVisivel).toHaveBeenCalledOnce();
  });
});
