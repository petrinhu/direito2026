// @vitest-environment jsdom
/* global DOMRect */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import FiguraPiramide from '@/ui/piramide3d/FiguraPiramide.vue';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import type { StoreModoAdaptado } from '@/app/stores/modoAdaptado';
import type { ControleSom, MotorFigura } from '@/app/piramide3d/tiposMotor';

const ambiente = vi.hoisted(() => ({
  temWebGL2: vi.fn(() => true),
  medirJanela: vi.fn(() => ({ largura: 1280, altura: 720 })),
  temaEscuro: vi.fn(() => false)
}));
const carregador = vi.hoisted(() => ({ carregarMotor: vi.fn() }));

vi.mock('@/app/piramide3d/ambiente', () => ambiente);
vi.mock('@/app/piramide3d/carregarMotor', () => carregador);

const DADOS = { aria: 'descrição sintética', niveis: [] };

let aoMudarSom: () => void = () => undefined;
let estadoSom = { disponivel: false, desbloqueado: false, ativo: true };
const som: ControleSom = {
  estado: () => estadoSom,
  ouvir: (fn) => {
    aoMudarSom = fn;
    return () => undefined;
  },
  alternar: vi.fn(),
  testar: vi.fn(),
  definirReduzido: vi.fn()
};

function motorFalso(): MotorFigura & { destruir: ReturnType<typeof vi.fn> } {
  const destruir = vi.fn();
  return {
    destruir,
    criarFigura: vi.fn(() => ({ redimensionar: vi.fn(), destruir })),
    obterSom: vi.fn(() => som)
  };
}

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

let montado: VueWrapper | undefined;
type ConsultaFalsa = { matches: boolean; ouvintes: ((e: { matches: boolean }) => void)[] };
let consultaReduzido: ConsultaFalsa;
let consultaEscuro: ConsultaFalsa;

function montar(adaptado = false) {
  const efetivo = ref(adaptado);
  const loja = { efetivo } as unknown as StoreModoAdaptado;
  const figura = document.createElement('figure');
  document.body.appendChild(figura);
  montado = mount(FiguraPiramide, {
    props: { chave: 'piramide-kelsen', dados: DADOS },
    attachTo: figura,
    global: { provide: { [CHAVE_STORE_MODO_ADAPTADO as symbol]: loja } }
  });
  return figura;
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', ObservadorFalso);
  consultaReduzido = { matches: false, ouvintes: [] };
  consultaEscuro = { matches: false, ouvintes: [] };
  // Duas consultas distintas: movimento reduzido e esquema de cor do sistema.
  vi.stubGlobal(
    'matchMedia',
    vi.fn((consulta: string) => {
      const alvo = consulta.includes('reduced-motion') ? consultaReduzido : consultaEscuro;
      return {
        get matches() {
          return alvo.matches;
        },
        addEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
          alvo.ouvintes.push(fn),
        removeEventListener: () => undefined
      };
    })
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 760
  } as DOMRect);
  ambiente.temWebGL2.mockReturnValue(true);
  ambiente.medirJanela.mockReturnValue({ largura: 1280, altura: 720 });
  carregador.carregarMotor.mockReset();
  estadoSom = { disponivel: false, desbloqueado: false, ativo: true };
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('FiguraPiramide: controle de som', () => {
  it('sem 3D montado, o componente fica escondido e sem botões de som', () => {
    montar();
    const raiz = document.querySelector('.figura-piramide3d') as HTMLElement;
    expect(raiz.hasAttribute('hidden')).toBe(true);
    expect(document.querySelector('.figura-piramide3d__botao')).toBeNull();
  });

  it('com o 3D montado e o som pronto, mostra o botão de três estados e o "Testar som"', async () => {
    carregador.carregarMotor.mockResolvedValue(motorFalso());
    montar();
    ObservadorFalso.ultimo?.cruzar();
    await flushPromises();
    const raiz = document.querySelector('.figura-piramide3d') as HTMLElement;
    expect(raiz.hasAttribute('hidden')).toBe(false);
    // som ainda não preparado: sem controles.
    expect(document.querySelector('.figura-piramide3d__botao')).toBeNull();

    estadoSom = { disponivel: true, desbloqueado: false, ativo: true };
    aoMudarSom();
    await nextTick();
    const botoes = [...document.querySelectorAll('.figura-piramide3d__botao')] as HTMLElement[];
    expect(botoes.map((b) => b.textContent?.trim())).toEqual([
      'Som: clique para ligar',
      'Testar som'
    ]);
    expect(document.querySelector('.figura-piramide3d__aviso')).not.toBeNull();
    expect(botoes[0]?.getAttribute('aria-pressed')).toBe('false');

    estadoSom = { disponivel: true, desbloqueado: true, ativo: true };
    aoMudarSom();
    await nextTick();
    expect(document.querySelector('.figura-piramide3d__botao')?.textContent?.trim()).toBe(
      'Som ligado'
    );
    expect(document.querySelector('.figura-piramide3d__botao')?.getAttribute('aria-pressed')).toBe(
      'true'
    );
    expect(document.querySelector('.figura-piramide3d__aviso')).toBeNull();

    estadoSom = { disponivel: true, desbloqueado: true, ativo: false };
    aoMudarSom();
    await nextTick();
    expect(document.querySelector('.figura-piramide3d__botao')?.textContent?.trim()).toBe(
      'Som desligado'
    );
    expect(document.querySelector('.figura-piramide3d__botao')?.getAttribute('aria-pressed')).toBe(
      'false'
    );
  });

  it('os botões chamam alternar e testar do controle de som', async () => {
    carregador.carregarMotor.mockResolvedValue(motorFalso());
    montar();
    ObservadorFalso.ultimo?.cruzar();
    await flushPromises();
    estadoSom = { disponivel: true, desbloqueado: true, ativo: true };
    aoMudarSom();
    await nextTick();
    const botoes = [...document.querySelectorAll('.figura-piramide3d__botao')] as HTMLElement[];
    botoes[0]?.click();
    botoes[1]?.click();
    expect(som.alternar).toHaveBeenCalledTimes(1);
    expect(som.testar).toHaveBeenCalledTimes(1);
  });
});

describe('FiguraPiramide: movimento reduzido', () => {
  it('entrega ao motor o valor da preferência do sistema', async () => {
    consultaReduzido.matches = true;
    const motor = motorFalso();
    carregador.carregarMotor.mockResolvedValue(motor);
    montar();
    ObservadorFalso.ultimo?.cruzar();
    await flushPromises();
    const opcoes = (motor.criarFigura as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(opcoes.reduzido).toBe(true);
  });

  it('se a preferência muda com a figura montada, a figura é refeita com o valor novo', async () => {
    const motor = motorFalso();
    carregador.carregarMotor.mockResolvedValue(motor);
    montar();
    ObservadorFalso.ultimo?.cruzar();
    await flushPromises();
    expect((motor.criarFigura as ReturnType<typeof vi.fn>).mock.calls[0]?.[0].reduzido).toBe(false);
    consultaReduzido.ouvintes.forEach((fn) => fn({ matches: true }));
    await flushPromises();
    expect(motor.destruir).toHaveBeenCalledTimes(1);
    expect(motor.criarFigura).toHaveBeenCalledTimes(2);
    expect((motor.criarFigura as ReturnType<typeof vi.fn>).mock.calls[1]?.[0].reduzido).toBe(true);
  });
});

describe('FiguraPiramide: tema do sistema', () => {
  it('se o sistema troca de claro para escuro com a figura montada, a figura é refeita', async () => {
    const motor = motorFalso();
    carregador.carregarMotor.mockResolvedValue(motor);
    montar();
    ObservadorFalso.ultimo?.cruzar();
    await flushPromises();
    expect(motor.criarFigura).toHaveBeenCalledTimes(1);
    ambiente.temaEscuro.mockReturnValue(true);
    consultaEscuro.ouvintes.forEach((fn) => fn({ matches: true }));
    await flushPromises();
    expect(motor.destruir).toHaveBeenCalledTimes(1);
    expect(motor.criarFigura).toHaveBeenCalledTimes(2);
    expect((motor.criarFigura as ReturnType<typeof vi.fn>).mock.calls[1]?.[0].escuro).toBe(true);
  });
});
