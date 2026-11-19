// @vitest-environment jsdom
/* global DOMRect */
// PIR-PLANA (M1, M2): quando a figura volta à versão plana, o foco vai para o item EQUIVALENTE da lista,
// não para o primeiro. A lista é a de produção (resumo.ts), e o seletor li[data-nivel] tem de casar com ela.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { ref } from 'vue';
import FiguraPiramide from '@/ui/piramide3d/FiguraPiramide.vue';
import { criarFigura } from '@/ui/piramide3d/figura';
import { ouvirContextoDoWebgl } from '@/ui/piramide3d/contexto';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import type { StoreModoAdaptado } from '@/app/stores/modoAdaptado';
import type { ControleSom } from '@/app/piramide3d/tiposMotor';
import { resumo } from '@/conteudo/p1/intr-direito/u3-material-norma-interpretacao/resumo';

const ambiente = vi.hoisted(() => ({
  temWebGL2: vi.fn(() => true),
  medirJanela: vi.fn(() => ({ largura: 1280, altura: 720 })),
  temaEscuro: vi.fn(() => false)
}));
const carregador = vi.hoisted(() => ({ carregarMotor: vi.fn() }));

vi.mock('@/app/piramide3d/ambiente', () => ambiente);
vi.mock('@/app/piramide3d/carregarMotor', () => carregador);
vi.mock('@/ui/piramide3d/controleSom', () => ({
  somDaPagina: () => ({ tocar: () => undefined })
}));

// Mesma ligação de cena.ts:montarCena: a perda avisa a figura.
vi.mock('@/ui/piramide3d/cena', () => ({
  criarCena: (opcoes: { canvas: HTMLCanvasElement; aoPerderContexto?: () => void }) => {
    ouvirContextoDoWebgl(opcoes.canvas, {
      onPerdido: () => opcoes.aoPerderContexto?.(),
      onRestaurado: () => undefined
    });
    return {
      setAtivo: (): void => undefined,
      animar: (): boolean => true,
      render: (): void => undefined,
      canvasEmVoo: (): boolean => false,
      redimensionar: (): void => undefined,
      opacidadeRotulos: (): number => 1,
      projetar: () => ({ x: 0, y: 0 }),
      silhuetas: () => new Map(),
      frentes: () => new Map(),
      poligonoFinal: () => null,
      dispose: (): void => undefined
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

// Três níveis reais da pirâmide de Kelsen: o do meio é o que separa "primeiro" de "equivalente".
const NIVEIS = ['regulamentos', 'normas-gerais', 'constituicao-positiva'] as const;
const DADOS = {
  aria: 'descrição sintética',
  niveis: NIVEIS.map((nivel) => ({
    nivel,
    nome: nivel,
    rotulo: nivel,
    explicacao: '',
    exemplo: ''
  }))
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

/** A versão plana com a lista de níveis que vier em `itens` (os ids dos níveis presentes na lista). */
function montarPlana(itens: readonly string[]): void {
  figura = document.createElement('figure');
  figura.id = 'figura-piramide-kelsen';
  figura.className = 'figura-piramide';
  const lis = itens.map((nivel) => `<li data-nivel="${nivel}">${nivel}</li>`).join('');
  figura.innerHTML = `<ol class="figura-piramide__lista">${lis}</ol>`;
  document.body.appendChild(figura);
}

async function montarEmTresD(): Promise<HTMLCanvasElement> {
  const loja = { efetivo: ref(false) } as unknown as StoreModoAdaptado;
  montado = mount(FiguraPiramide, {
    props: { chave: 'piramide-kelsen', dados: DADOS },
    attachTo: figura,
    global: { provide: { [CHAVE_STORE_MODO_ADAPTADO as symbol]: loja } }
  });
  ObservadorFalso.ultimo?.cruzar();
  await flushPromises();
  // Montagem válida: a figura entrou em 3D antes da perda.
  expect(figura.getAttribute('data-3d')).toBe('on');
  return figura.querySelector<HTMLCanvasElement>('canvas.pir-tela') as HTMLCanvasElement;
}

function perderSemRestaurar(canvas: HTMLCanvasElement): void {
  canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  vi.advanceTimersByTime(3000);
}

describe('M1: o foco vai para o item equivalente, não para o primeiro', () => {
  it('foco no rótulo do meio: depois da versão plana, o foco está no li do meio', async () => {
    montarPlana(NIVEIS);
    const canvas = await montarEmTresD();
    const meio = figura.querySelector<HTMLButtonElement>(
      'button.pir-rotulo[data-nivel="normas-gerais"]'
    );
    meio?.focus();
    // Montagem válida: o foco estava de fato no rótulo do meio.
    expect(document.activeElement).toBe(meio);

    perderSemRestaurar(canvas);

    expect(figura.hasAttribute('data-3d')).toBe(false);
    expect(document.activeElement).toBe(figura.querySelector('li[data-nivel="normas-gerais"]'));
  });
});

describe('M2: a lista de produção casa com o seletor, e o foco nunca se perde no body', () => {
  it('o conteúdo real da figura Kelsen tem li[data-nivel] iguais aos níveis dos dados 3D', () => {
    const bloco = resumo.find((b) => b.figuras3d?.some((f) => f.alvo === 'figura-piramide-kelsen'));
    const dados = bloco?.figuras3d?.find((f) => f.alvo === 'figura-piramide-kelsen')?.dados;
    expect(bloco).toBeDefined();
    expect(dados).toBeDefined();
    const pagina = document.createElement('div');
    pagina.innerHTML = bloco?.corpoHtml ?? '';
    const figuraReal = pagina.querySelector<HTMLElement>('#figura-piramide-kelsen');
    expect(figuraReal).not.toBeNull();

    const pelaBusca = [...(figuraReal?.querySelectorAll('li[data-nivel]') ?? [])].map(
      (li) => (li as HTMLElement).dataset.nivel
    );
    const pelaLista = [...(figuraReal?.querySelectorAll('ol.figura-piramide__lista > li') ?? [])];

    // Montagem válida: a lista de produção tem itens.
    expect(pelaLista.length).toBeGreaterThan(0);
    expect(pelaBusca).toHaveLength(pelaLista.length);
    expect([...pelaBusca].sort()).toEqual((dados?.niveis ?? []).map((n) => n.nivel).sort());
  });

  it('se o item equivalente não está na lista, o foco cai na figura, não no body', async () => {
    // A lista só traz um dos níveis: o rótulo de "regulamentos" no 3D não tem item plano.
    montarPlana(['normas-gerais']);
    const canvas = await montarEmTresD();
    const sem = figura.querySelector<HTMLButtonElement>(
      'button.pir-rotulo[data-nivel="regulamentos"]'
    );
    sem?.focus();
    // Montagem válida: o foco estava no rótulo sem item plano.
    expect(document.activeElement).toBe(sem);

    perderSemRestaurar(canvas);

    expect(document.activeElement).toBe(figura);
  });
});
