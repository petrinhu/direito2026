// @vitest-environment jsdom
// PIR-PLANA (B1, revisão adversarial): a liberação da cena faz o renderer perder o contexto de propósito
// (forceContextLoss). Esse evento não pode chegar à figura, que pode já estar destruída, e a escuta do
// canvas precisa sair antes da liberação. Renderer e gerador de ambiente são falsos; cena.ts é real.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import type { OpcoesCena } from '@/ui/piramide3d/cena';
import { criarCena } from '@/ui/piramide3d/cena';
import { PERFIS } from '@/app/piramide3d/nucleo';

const falso = vi.hoisted(() => ({
  pmremFalha: false,
  dispose: vi.fn(),
  forceContextLoss: vi.fn()
}));

vi.mock('three', async (importOriginal) => {
  const real = await importOriginal<typeof import('three')>();
  // O forceContextLoss real dispara webglcontextlost no canvas: é o que a sonda do revisor reproduz.
  class WebGLRendererFalso {
    readonly domElement: HTMLCanvasElement;
    readonly shadowMap = { enabled: false, type: 0 };
    toneMapping = 0;
    constructor(opcoes: { canvas: HTMLCanvasElement }) {
      this.domElement = opcoes.canvas;
    }
    setPixelRatio(): void {}
    setClearColor(): void {}
    setSize(): void {}
    render(): void {}
    initTexture(): void {}
    getDrawingBufferSize(alvo: THREE.Vector2): THREE.Vector2 {
      return alvo;
    }
    dispose(): void {
      falso.dispose();
    }
    forceContextLoss(): void {
      falso.forceContextLoss();
      this.domElement.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    }
  }
  class PMREMGeneratorFalso {
    constructor() {
      if (falso.pmremFalha) throw new Error('falha sintética depois de ligar o aviso');
    }
    fromScene(): { texture: THREE.Texture } {
      return { texture: new real.Texture() };
    }
    dispose(): void {}
  }
  return { ...real, WebGLRenderer: WebGLRendererFalso, PMREMGenerator: PMREMGeneratorFalso };
});

function corDe(valor: string): THREE.Color {
  return new THREE.Color(valor);
}

function opcoesDeTeste(aoPerderContexto: () => void): OpcoesCena {
  const paleta = {
    fundo: corDe('#101010'),
    texto: corDe('#f0f0f0'),
    ouro: corDe('#c9a227'),
    ouroLuz: corDe('#f5d76e'),
    petroleo: corDe('#123a44'),
    areia: corDe('#d8c9a3'),
    sombra: corDe('#050505'),
    faceCores: {
      topo: '#1', base: '#2', faixa: '#3', nome: '#4', explicacao: '#5',
      exemploTexto: '#6', exemploRotulo: '#7', filete: '#8'
    }
  };
  return {
    canvas: document.createElement('canvas'),
    cenaEl: document.createElement('div'),
    perfil: PERFIS.kelsen,
    paleta,
    escuro: false,
    reduzido: true,
    textos: new Map(),
    aoPerderContexto
  } as unknown as OpcoesCena;
}

// O jsdom não tem canvas 2D: a face e o halo pedem um contexto para medir texto. Basta um que aceite as chamadas.
function contextoDe2dFalso(): unknown {
  const alvo: Record<string, unknown> = {};
  const contexto: unknown = new Proxy(alvo, {
    get: (guarda, nome: string | symbol) => {
      if (nome in guarda) return guarda[nome as string];
      if (nome === 'measureText') return () => ({ width: 10 });
      return () => contexto;
    },
    set: (guarda, nome: string | symbol, valor: unknown) => {
      guarda[nome as string] = valor;
      return true;
    }
  });
  return contexto;
}

beforeEach(() => {
  falso.pmremFalha = false;
  falso.dispose.mockClear();
  falso.forceContextLoss.mockClear();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => contextoDe2dFalso() as CanvasRenderingContext2D
  );
  // O jsdom não tem document.fonts: a cena só pede o carregamento das fontes e espera.
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { load: () => Promise.resolve([]), ready: Promise.resolve() }
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (document as { fonts?: unknown }).fonts;
});

describe('cena real: a liberação não avisa a figura da própria perda', () => {
  it('dispose() da cena não dispara aoPerderContexto (a figura pode já estar destruída)', () => {
    const aoPerder = vi.fn();
    const opcoes = opcoesDeTeste(aoPerder);
    const cena = criarCena(opcoes);

    cena.dispose();

    // Montagem válida: a liberação de fato foi feita, e o contexto foi perdido de propósito.
    expect(falso.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(aoPerder).not.toHaveBeenCalled();
  });

  it('perda de verdade, antes da liberação, ainda avisa a figura uma vez', () => {
    const aoPerder = vi.fn();
    const opcoes = opcoesDeTeste(aoPerder);
    criarCena(opcoes);

    opcoes.canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));

    expect(aoPerder).toHaveBeenCalledTimes(1);
  });

  it('falha depois de ligar o aviso não avisa a figura na liberação de catch (gêmeo de dispose)', () => {
    falso.pmremFalha = true;
    const aoPerder = vi.fn();
    const opcoes = opcoesDeTeste(aoPerder);

    expect(() => criarCena(opcoes)).toThrow('falha sintética depois de ligar o aviso');

    // Montagem válida: a liberação de catch rodou e perdeu o contexto de propósito.
    expect(falso.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(aoPerder).not.toHaveBeenCalled();
  });
});
