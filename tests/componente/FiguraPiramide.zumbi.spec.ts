// @vitest-environment jsdom
/* global DOMRect, FrameRequestCallback */
// PIR-PLANA (B1, revisão adversarial): um prazo de contexto armado por uma figura já destruída não pode
// derrubar a figura nova. A cena falsa despacha webglcontextlost no dispose, como o forceContextLoss real.
// O espião fica na fronteira figura -> componente (aoDesistir), que é onde o zumbi chegava.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import FiguraPiramide from '@/ui/piramide3d/FiguraPiramide.vue';
import { criarFigura } from '@/ui/piramide3d/figura';
import { ouvirContextoDoWebgl } from '@/ui/piramide3d/contexto';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import type { StoreModoAdaptado } from '@/app/stores/modoAdaptado';
import type { ControleSom } from '@/app/piramide3d/tiposMotor';

const ambiente = vi.hoisted(() => ({
  temWebGL2: vi.fn(() => true),
  medirJanela: vi.fn(() => ({ largura: 1280, altura: 720 })),
  temaEscuro: vi.fn(() => false)
}));
const carregador = vi.hoisted(() => ({ carregarMotor: vi.fn() }));
const falsa = vi.hoisted(() => ({
  contextosVivos: 0,
  dispose: 0,
  quadros: 0,
  // Ponto de partida do espião: quantas vezes a figura pediu desistência ao componente.
  desistencias: 0,
  // Os aoDesistir recebidos pelo componente, na ordem de criação (para chamar um de uma figura antiga).
  aoDesistirRecebidos: [] as Array<() => void>
}));

vi.mock('@/app/piramide3d/ambiente', () => ambiente);
vi.mock('@/app/piramide3d/carregarMotor', () => carregador);
vi.mock('@/ui/piramide3d/controleSom', () => ({
  somDaPagina: () => ({ tocar: () => undefined })
}));

// Mesma ligação de cena.ts:montarCena: a perda e a restauração avisam a figura.
// O dispose despacha webglcontextlost, como o forceContextLoss real faz.
vi.mock('@/ui/piramide3d/cena', () => ({
  criarCena: (opcoes: {
    canvas: HTMLCanvasElement;
    aoPerderContexto?: () => void;
    aoRestaurarContexto?: () => void;
  }) => {
    falsa.contextosVivos += 1;
    ouvirContextoDoWebgl(opcoes.canvas, {
      onPerdido: () => opcoes.aoPerderContexto?.(),
      onRestaurado: () => opcoes.aoRestaurarContexto?.()
    });
    return {
      setAtivo: (): void => undefined,
      animar: (): boolean => {
        falsa.quadros += 1;
        return true;
      },
      render: (): void => undefined,
      canvasEmVoo: (): boolean => false,
      redimensionar: (): void => undefined,
      opacidadeRotulos: (): number => 1,
      projetar: () => ({ x: 0, y: 0 }),
      silhuetas: () => new Map(),
      frentes: () => new Map(),
      poligonoFinal: () => null,
      dispose(): void {
        falsa.dispose += 1;
        opcoes.canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
        falsa.contextosVivos -= 1;
      }
    };
  }
}));

class ObservadorFalso {
  static ultimo: ObservadorFalso | null = null;
  constructor(private readonly aoCruzar: (e: { isIntersecting: boolean }[]) => void) {
    ObservadorFalso.ultimo = this;
  }
  observe(): void {}
  disconnect(): void {}
  cruzar(): void {
    this.aoCruzar([{ isIntersecting: true }]);
  }
}

const som: ControleSom = {
  estado: () => ({ disponivel: false, desbloqueado: false, ativo: true }),
  ouvir: () => () => undefined,
  alternar: vi.fn(),
  testar: vi.fn(),
  definirReduzido: vi.fn()
};

const DADOS = {
  aria: 'descrição sintética',
  niveis: [
    {
      nivel: 'regulamentos',
      nome: 'Regulamentos',
      rotulo: 'Regulamentos',
      explicacao: '',
      exemplo: ''
    }
  ]
};

interface Agendado {
  readonly id: number;
  readonly cb: FrameRequestCallback;
}

let montado: VueWrapper | undefined;
let figura: HTMLElement;
let fila: Agendado[] = [];
let proximoId = 1;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.stubGlobal('IntersectionObserver', ObservadorFalso);
  fila = [];
  proximoId = 1;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = proximoId++;
    fila.push({ id, cb });
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    fila = fila.filter((a) => a.id !== id);
  });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    }))
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 760
  } as DOMRect);
  ambiente.temWebGL2.mockReturnValue(true);
  ambiente.medirJanela.mockReturnValue({ largura: 1280, altura: 720 });
  falsa.contextosVivos = 0;
  falsa.dispose = 0;
  falsa.quadros = 0;
  falsa.desistencias = 0;
  falsa.aoDesistirRecebidos = [];
  carregador.carregarMotor.mockResolvedValue({
    obterSom: () => som,
    criarFigura: (opcoes: Parameters<typeof criarFigura>[0]) => {
      const recebido = opcoes.aoDesistir ?? (() => undefined);
      falsa.aoDesistirRecebidos.push(recebido);
      return criarFigura({
        ...opcoes,
        aoDesistir: () => {
          falsa.desistencias += 1;
          recebido();
        }
      });
    }
  });

  figura = document.createElement('figure');
  figura.id = 'figura-piramide-kelsen';
  figura.className = 'figura-piramide';
  figura.innerHTML =
    '<ol class="figura-piramide__lista"><li data-nivel="regulamentos">Regulamentos</li></ol>';
  document.body.appendChild(figura);
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  ObservadorFalso.ultimo = null;
});

async function montarEmTresD(): Promise<HTMLCanvasElement> {
  const loja = { efetivo: ref(false) } as unknown as StoreModoAdaptado;
  montado = mount(FiguraPiramide, {
    props: { chave: 'piramide-kelsen', dados: DADOS },
    attachTo: figura,
    global: { provide: { [CHAVE_STORE_MODO_ADAPTADO as symbol]: loja } }
  });
  ObservadorFalso.ultimo?.cruzar();
  await flushPromises();
  // Montagem válida: a figura entrou em 3D antes de qualquer troca.
  expect(figura.getAttribute('data-3d')).toBe('on');
  const canvas = figura.querySelector<HTMLCanvasElement>('canvas.pir-tela');
  expect(canvas).not.toBeNull();
  return canvas as HTMLCanvasElement;
}

function perderContexto(canvas: HTMLCanvasElement): void {
  canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
}

function trocarTema(): void {
  document.documentElement.setAttribute('data-theme', 'escuro');
}

function largarTema(): void {
  document.documentElement.removeAttribute('data-theme');
}

async function resize(largura: number, altura: number): Promise<void> {
  ambiente.medirJanela.mockReturnValue({ largura, altura });
  window.dispatchEvent(new Event('resize'));
  await flushPromises();
  await nextTick();
}

describe('ZUMBI (B1): o prazo de uma figura destruída não derruba a figura nova', () => {
  it('troca de tema: a figura nova não é derrubada 3 s depois pelo prazo da antiga', async () => {
    await montarEmTresD();
    trocarTema();
    await flushPromises();
    await nextTick();
    expect(figura.getAttribute('data-3d')).toBe('on');

    vi.advanceTimersByTime(3000);
    await flushPromises();

    expect(figura.getAttribute('data-3d')).toBe('on');
    largarTema();
  });

  it('plana por resize e volta ao 3D depois de 3 s: a volta não pode ficar bloqueada', async () => {
    await montarEmTresD();
    await resize(500, 400);
    expect(figura.hasAttribute('data-3d')).toBe(false);

    vi.advanceTimersByTime(3000);
    await flushPromises();
    await resize(1280, 720);

    expect(figura.getAttribute('data-3d')).toBe('on');
  });

  it('um aoDesistir de figura antiga, chamado depois da troca, não toca na figura nova', async () => {
    await montarEmTresD();
    const antigo = falsa.aoDesistirRecebidos[0];
    expect(antigo).toBeDefined();
    trocarTema();
    await flushPromises();
    await nextTick();
    expect(figura.getAttribute('data-3d')).toBe('on');

    antigo?.();
    await flushPromises();
    await nextTick();

    expect(figura.getAttribute('data-3d')).toBe('on');
    largarTema();
  });

  it('figura destruída dentro da janela de 3 s: o prazo armado antes não desiste (mutante A)', async () => {
    const canvas = await montarEmTresD();
    perderContexto(canvas);
    vi.advanceTimersByTime(2000);
    await resize(500, 400);
    expect(figura.hasAttribute('data-3d')).toBe(false);

    vi.advanceTimersByTime(3000);
    await flushPromises();

    // Montagem válida: a desmontagem de fato aconteceu dentro da janela.
    expect(figura.hasAttribute('data-3d')).toBe(false);
    expect(falsa.desistencias).toBe(0);
  });

  it('perda, segunda perda antes do prazo e restauração: o 3D segue e nenhum prazo antigo dispara (mutante B)', async () => {
    const canvas = await montarEmTresD();
    perderContexto(canvas);
    vi.advanceTimersByTime(2000);
    perderContexto(canvas);
    vi.advanceTimersByTime(500);
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    vi.advanceTimersByTime(5000);
    await flushPromises();

    expect(figura.getAttribute('data-3d')).toBe('on');
    expect(falsa.desistencias).toBe(0);
    expect(falsa.dispose).toBe(0);
  });
});
