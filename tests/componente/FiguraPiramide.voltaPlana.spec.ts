// @vitest-environment jsdom
/* global DOMRect */
// PIR-PLANA (PIR-T3b): contexto WebGL que não volta em 3 s devolve a figura à versão plana.
// Cena falsa, mas com a escuta real do canvas (ouvirContextoDoWebgl), ligada como em cena.ts:montarCena.
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
  disposeLanca: false
}));

vi.mock('@/app/piramide3d/ambiente', () => ambiente);
vi.mock('@/app/piramide3d/carregarMotor', () => carregador);
vi.mock('@/ui/piramide3d/controleSom', () => ({
  somDaPagina: () => ({ tocar: () => undefined })
}));

// Mesma ligação de cena.ts:montarCena: a perda e a restauração avisam a figura;
// a restauração avisa a figura.
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
      animar: (): boolean => false,
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
        falsa.contextosVivos -= 1;
        if (falsa.disposeLanca) throw new Error('dispose sintético');
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

let montado: VueWrapper | undefined;
let figura: HTMLElement;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.stubGlobal('IntersectionObserver', ObservadorFalso);
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
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
  carregador.carregarMotor.mockResolvedValue({ criarFigura, obterSom: () => som });
  falsa.contextosVivos = 0;
  falsa.dispose = 0;
  falsa.disposeLanca = false;

  // A versão plana: a lista de níveis, que fica na página nos dois modos.
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
  // Montagem válida: a figura entrou em 3D antes de qualquer perda.
  expect(figura.getAttribute('data-3d')).toBe('on');
  const canvas = figura.querySelector<HTMLCanvasElement>('canvas.pir-tela');
  expect(canvas).not.toBeNull();
  return canvas as HTMLCanvasElement;
}

function perderContexto(canvas: HTMLCanvasElement): void {
  canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
}

describe('PIR-PLANA: contexto WebGL que não volta devolve a versão plana', () => {
  it('sem webglcontextrestored em 3 s, o 3D sai, data-3d some e a lista segue com o mesmo texto', async () => {
    const canvas = await montarEmTresD();
    const lista = figura.querySelector('.figura-piramide__lista');
    const textoAntes = lista?.textContent;

    perderContexto(canvas);
    vi.advanceTimersByTime(2999);
    // Antes do prazo, a figura segue em 3D: a espera de 3 s é de fato a espera.
    expect(figura.getAttribute('data-3d')).toBe('on');

    vi.advanceTimersByTime(1);
    expect(figura.hasAttribute('data-3d')).toBe(false);
    // O hidden do Vue chega ao DOM no próximo tick, como no navegador.
    await nextTick();
    expect(figura.querySelector('.figura-piramide3d')?.hasAttribute('hidden')).toBe(true);
    expect(lista?.textContent).toBe(textoAntes);
  });

  it('a volta acontece e nenhum contexto WebGL fica vivo depois dela', async () => {
    const canvas = await montarEmTresD();
    perderContexto(canvas);
    vi.advanceTimersByTime(3000);

    expect(falsa.dispose).toBe(1);
    expect(falsa.contextosVivos).toBe(0);
  });

  it('se o foco estava num rótulo, ele vai para o item equivalente da lista', async () => {
    const canvas = await montarEmTresD();
    const botao = figura.querySelector<HTMLButtonElement>(
      'button.pir-rotulo[data-nivel="regulamentos"]'
    );
    botao?.focus();
    // Montagem válida: o foco estava de fato no rótulo do 3D.
    expect(document.activeElement).toBe(botao);

    perderContexto(canvas);
    vi.advanceTimersByTime(3000);

    expect(document.activeElement).toBe(figura.querySelector('li[data-nivel="regulamentos"]'));
  });

  it('se o dispose lança, a versão plana volta do mesmo jeito', async () => {
    const canvas = await montarEmTresD();
    falsa.disposeLanca = true;
    perderContexto(canvas);
    vi.advanceTimersByTime(3000);

    expect(figura.hasAttribute('data-3d')).toBe(false);
  });

  it('restaurado dentro dos 3 s, a figura segue em 3D e não desmonta', async () => {
    const canvas = await montarEmTresD();
    perderContexto(canvas);
    vi.advanceTimersByTime(2000);
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    vi.advanceTimersByTime(5000);

    expect(figura.getAttribute('data-3d')).toBe('on');
    expect(falsa.dispose).toBe(0);
  });
});
