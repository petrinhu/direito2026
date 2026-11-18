// @vitest-environment jsdom
/* global FrameRequestCallback */
// PIR-H7: a fatia em voo tem de seguir animando mesmo com a figura fora da tela, porque o canvas em voo
// é fixo na janela inteira. Cena falsa, mas fiel à ordem de cena.ts: a classe é aplicada no começo de
// animar (cena.ts:842-843) e a volta só tira o estado no fim (cena.ts:923-925), um quadro depois.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarFigura } from '@/ui/piramide3d/figura';
import type { OpcoesFigura } from '@/app/piramide3d/tiposMotor';

const falsa = vi.hoisted(() => ({
  ultima: null as null | { canvasEmVoo(): boolean }
}));

vi.mock('@/ui/piramide3d/controleSom', () => ({
  somDaPagina: () => ({ tocar: () => undefined })
}));

// Quadros de volta armados por setAtivo(null), como a volta de 650 ms da cena real.
const QUADROS_DE_VOLTA = 5;

vi.mock('@/ui/piramide3d/cena', () => ({
  criarCena: (opcoes: { canvas: HTMLCanvasElement }) => {
    let ativo: string | null = null;
    let emVoo = false;
    let voltaRestante = 0;
    let aplicado = false;
    const cena = {
      setAtivo(nivel: string | null): void {
        if (nivel === ativo) return;
        ativo = nivel;
        if (nivel === null) {
          emVoo = true;
          voltaRestante = QUADROS_DE_VOLTA;
        }
      },
      animar(): boolean {
        const voo = ativo !== null || emVoo;
        opcoes.canvas.classList.toggle('pir-tela--voo', voo);
        aplicado = voo;
        let algumaVolta = false;
        if (ativo === null && voltaRestante > 0) {
          voltaRestante -= 1;
          algumaVolta = voltaRestante > 0;
        }
        const proximoVoo = ativo !== null || algumaVolta;
        emVoo = proximoVoo;
        // Partículas com movimento normal: a cena pede quadro sempre (cena.ts:943).
        return true;
      },
      canvasEmVoo(): boolean {
        return aplicado;
      },
      render(): void {},
      redimensionar(): void {},
      opacidadeRotulos(): number {
        return 1;
      },
      projetar(): { x: number; y: number } {
        return { x: 0, y: 0 };
      },
      silhuetas(): Map<string, never> {
        return new Map();
      },
      frentes(): Map<string, never> {
        return new Map();
      },
      poligonoFinal(): null {
        return null;
      },
      dispose(): void {}
    };
    falsa.ultima = cena;
    return cena;
  }
}));

interface Agendado {
  readonly id: number;
  readonly cb: FrameRequestCallback;
}

let fila: Agendado[] = [];
let proximoId = 1;
let agora = 0;

function avancar(quadros: number): void {
  for (let i = 0; i < quadros; i++) {
    agora += 16;
    const atuais = fila;
    fila = [];
    for (const a of atuais) a.cb(agora);
  }
}

class ObservadorFalso {
  static ultimo: ObservadorFalso | null = null;
  constructor(readonly aoCruzar: (e: { isIntersecting: boolean }[]) => void) {
    ObservadorFalso.ultimo = this;
  }
  observe(): void {}
  disconnect(): void {}
}

let palco: HTMLElement;

beforeEach(() => {
  fila = [];
  agora = 0;
  proximoId = 1;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = proximoId++;
    fila.push({ id, cb });
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    fila = fila.filter((a) => a.id !== id);
  });
  vi.stubGlobal('IntersectionObserver', ObservadorFalso);

  const figura = document.createElement('figure');
  palco = document.createElement('div');
  figura.appendChild(palco);
  document.body.appendChild(figura);
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  falsa.ultima = null;
  ObservadorFalso.ultimo = null;
});

function montar(): HTMLCanvasElement {
  const opcoes: OpcoesFigura = {
    palco,
    chave: 'piramide-kelsen',
    dados: {
      aria: 'descrição sintética',
      niveis: [{ nivel: 'norma', nome: 'Norma', rotulo: 'Norma', explicacao: '', exemplo: '' }]
    },
    reduzido: false,
    escuro: false
  };
  const figura = criarFigura(opcoes);
  expect(figura).not.toBeNull();
  const canvas = palco.querySelector<HTMLCanvasElement>('canvas.pir-tela');
  expect(canvas).not.toBeNull();
  return canvas as HTMLCanvasElement;
}

describe('voo da pirâmide quando a figura sai da tela', () => {
  it('a volta termina mesmo com a figura fora da tela e o canvas sai do voo', () => {
    const canvas = montar();
    const botao = palco.querySelector<HTMLButtonElement>('button.pir-rotulo');
    expect(botao).not.toBeNull();

    // Montagem válida: a fatia abre de fato, senão o teste passaria de forma vazia.
    botao?.focus();
    avancar(3);
    expect(canvas.classList.contains('pir-tela--voo')).toBe(true);

    // A pessoa rola: o foco sai, a volta começa, e a figura sai da tela antes de ela acabar.
    botao?.blur();
    ObservadorFalso.ultimo?.aoCruzar([{ isIntersecting: false }]);
    avancar(10);

    expect(canvas.classList.contains('pir-tela--voo')).toBe(false);
  });
});
