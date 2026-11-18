// @vitest-environment jsdom
/* global FrameRequestCallback */
// PIR-H7: a fatia em voo tem de seguir animando mesmo com a figura fora da tela, porque o canvas em voo
// é fixo na janela inteira. Cena falsa, mas fiel à ordem de cena.ts: a classe é aplicada no começo de
// animar (cena.ts:842-843) e a volta só tira o estado no fim (cena.ts:923-925), um quadro depois.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarFigura } from '@/ui/piramide3d/figura';
import type { OpcoesFigura } from '@/app/piramide3d/tiposMotor';
import type { Ponto } from '@/core/piramide3d/tipos';

const falsa = vi.hoisted(() => ({
  ultima: null as null | { canvasEmVoo(): boolean },
  quadros: 0,
  lancarNoRender: 0,
  lancarNoAnimar: 0,
  reduzido: false
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
        falsa.quadros += 1;
        if (falsa.lancarNoAnimar > 0) {
          falsa.lancarNoAnimar -= 1;
          throw new Error('falha sintética em animar');
        }
        const voo = ativo !== null || emVoo;
        opcoes.canvas.classList.toggle('pir-tela--voo', voo);
        aplicado = voo;
        let algumaVolta = false;
        if (ativo === null && voltaRestante > 0) {
          voltaRestante -= 1;
          algumaVolta = voltaRestante > 0;
        }
        const proximoVoo = ativo !== null || algumaVolta;
        const mudou = proximoVoo !== voo;
        emVoo = proximoVoo;
        // Movimento normal: as partículas pedem quadro sempre (cena.ts:943). Reduzido: só transição ou volta.
        return !falsa.reduzido || mudou || algumaVolta;
      },
      canvasEmVoo(): boolean {
        return aplicado;
      },
      render(): void {
        if (falsa.lancarNoRender > 0) {
          falsa.lancarNoRender -= 1;
          throw new Error('falha sintética');
        }
      },
      redimensionar(): void {},
      opacidadeRotulos(): number {
        return 1;
      },
      projetar(): { x: number; y: number } {
        return { x: 0, y: 0 };
      },
      silhuetas(): Map<string, Ponto[]> {
        return new Map();
      },
      frentes(): Map<string, { poligono: Ponto[]; profundidade: number }> {
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
const falhasNaFila: unknown[] = [];
let proximoId = 1;
let agora = 0;

function avancar(quadros: number): void {
  for (let i = 0; i < quadros; i++) {
    agora += 16;
    const atuais = fila;
    fila = [];
    // Como no navegador: uma exceção num callback de quadro é reportada e não derruba a fila.
    for (const a of atuais) {
      try {
        a.cb(agora);
      } catch (erro) {
        falhasNaFila.push(erro);
      }
    }
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
  falsa.quadros = 0;
  falsa.lancarNoRender = 0;
  falsa.lancarNoAnimar = 0;
  falsa.reduzido = false;

  const figura = document.createElement('figure');
  palco = document.createElement('div');
  figura.appendChild(palco);
  document.body.appendChild(figura);
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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
  it('uma exceção num quadro não mata o laço: o erro vai ao console e o quadro seguinte roda', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    montar();
    palco.querySelector<HTMLButtonElement>('button.pir-rotulo')?.focus();

    falsa.lancarNoRender = 1;
    avancar(1);

    // Montagem válida: um quadro rodou e a falha foi registrada uma vez, com o prefixo da figura.
    expect(falsa.quadros).toBe(1);
    const registros = erro.mock.calls.filter((c) => String(c[0]).includes('[piramide3d]'));
    expect(registros).toHaveLength(1);

    avancar(1);
    expect(falsa.quadros).toBe(2);
  });
  it('fechar a fatia com o laço parado e a figura fora da tela pede quadro', () => {
    const canvas = montar();
    const botao = palco.querySelector<HTMLButtonElement>('button.pir-rotulo');
    expect(botao).not.toBeNull();

    // Movimento reduzido: com a fatia aberta e parada, o laço para de pedir quadros.
    falsa.reduzido = true;
    botao?.focus();
    avancar(3);
    expect(canvas.classList.contains('pir-tela--voo')).toBe(true);
    const quadrosComFatiaParada = falsa.quadros;
    avancar(5);
    // Montagem válida: o laço de fato parou com a fatia aberta.
    expect(falsa.quadros).toBe(quadrosComFatiaParada);

    // A figura sai da tela e a pessoa fecha a fatia: o canvas ainda está em voo, então precisa de quadro.
    ObservadorFalso.ultimo?.aoCruzar([{ isIntersecting: false }]);
    botao?.blur();
    avancar(10);

    expect(falsa.quadros).toBeGreaterThan(quadrosComFatiaParada);
    expect(canvas.classList.contains('pir-tela--voo')).toBe(false);
  });

  it('quando animar lança, o laço segue no quadro seguinte', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    montar();
    palco.querySelector<HTMLButtonElement>('button.pir-rotulo')?.focus();

    falsa.lancarNoAnimar = 1;
    avancar(1);
    // Montagem válida: o quadro de fato rodou e falhou dentro de animar.
    expect(falsa.quadros).toBe(1);
    expect(erro.mock.calls.filter((c) => String(c[0]).includes('[piramide3d]'))).toHaveLength(1);

    avancar(1);
    expect(falsa.quadros).toBe(2);
  });
});
