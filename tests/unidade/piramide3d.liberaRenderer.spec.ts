// @vitest-environment jsdom
// PIR-H1 (resíduo): se a cena falha depois de criar o renderer, o contexto WebGL não pode vazar.
// O renderer é trocado por um falso que lança logo depois de criado; o que se prova é a liberação.
import { describe, expect, it, vi } from 'vitest';
import type { OpcoesCena } from '@/ui/piramide3d/cena';
import { criarCena } from '@/ui/piramide3d/cena';

const falso = vi.hoisted(() => ({
  ultimo: null as null | { dispose: () => void; forceContextLoss: () => void },
  dispose: vi.fn(),
  forceContextLoss: vi.fn(),
  falharDispose: false
}));

vi.mock('three', async (importOriginal) => {
  const real = await importOriginal<typeof import('three')>();
  class WebGLRendererFalso {
    constructor() {
      falso.ultimo = this;
    }
    dispose(): void {
      falso.dispose();
      if (falso.falharDispose) throw new Error('falha ao liberar');
    }
    forceContextLoss(): void {
      falso.forceContextLoss();
    }
    setPixelRatio(): void {
      throw new Error('falha depois de criado');
    }
  }
  return { ...real, WebGLRenderer: WebGLRendererFalso };
});

describe('criarCena com falha depois de criar o renderer', () => {
  it('libera o contexto e repassa a causa', () => {
    falso.dispose.mockClear();
    falso.forceContextLoss.mockClear();
    const opcoes = {
      canvas: document.createElement('canvas'),
      cenaEl: document.createElement('div'),
      perfil: {},
      paleta: {},
      escuro: false,
      reduzido: false,
      textos: new Map()
    } as unknown as OpcoesCena;

    expect(() => criarCena(opcoes)).toThrow('falha depois de criado');

    // Montagem válida: o renderer foi de fato criado antes da falha.
    expect(falso.ultimo).not.toBeNull();
    expect(falso.dispose).toHaveBeenCalledTimes(1);
    expect(falso.forceContextLoss).toHaveBeenCalledTimes(1);
  });
  it('se a liberação também lança, o contexto é perdido mesmo assim e o erro original sobrevive', () => {
    falso.dispose.mockClear();
    falso.forceContextLoss.mockClear();
    falso.falharDispose = true;
    const opcoes = {
      canvas: document.createElement('canvas'),
      cenaEl: document.createElement('div'),
      perfil: {},
      paleta: {},
      escuro: false,
      reduzido: false,
      textos: new Map()
    } as unknown as OpcoesCena;

    try {
      expect(() => criarCena(opcoes)).toThrow('falha depois de criado');
      // Montagem válida: a liberação foi tentada e falhou.
      expect(falso.dispose).toHaveBeenCalledTimes(1);
      expect(falso.forceContextLoss).toHaveBeenCalledTimes(1);
    } finally {
      falso.falharDispose = false;
    }
  });
});
