// @vitest-environment jsdom
/* global DOMRect */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import BlocoTeorico from '@/ui/componentes/BlocoTeorico.vue';
import { CHAVE_STORE_MODO_ADAPTADO } from '@/app/chaves';
import type { StoreModoAdaptado } from '@/app/stores/modoAdaptado';
import type { BlocoResumo } from '@/core/unidade/tipos';
import type { FiguraMontada, MotorFigura } from '@/app/piramide3d/tiposMotor';

const ambiente = vi.hoisted(() => ({
  temWebGL2: vi.fn(() => true),
  medirJanela: vi.fn(() => ({ largura: 1280, altura: 720 })),
  temaEscuro: vi.fn(() => false)
}));
const carregador = vi.hoisted(() => ({ carregarMotor: vi.fn() }));

vi.mock('@/app/piramide3d/ambiente', () => ambiente);
vi.mock('@/app/piramide3d/carregarMotor', () => carregador);

/** Dados sintéticos: o teste não copia texto de estudo. */
const DADOS = {
  aria: 'descrição sintética da figura',
  niveis: [
    { nivel: 'n1', nome: 'Nome 1', rotulo: 'R1', explicacao: 'Explicação 1', exemplo: 'Exemplo 1' }
  ]
};

const HTML_DO_CORPO = `
  <p>Antes da figura.</p>
  <figure id="figura-sintetica" data-figura-3d="kelsen">
    <div class="figura-piramide__plana"><svg role="img" aria-label="plana"></svg></div>
    <figcaption>Legenda sintética</figcaption>
  </figure>
  <p>Depois da figura.</p>`;

function bloco(extra: Partial<BlocoResumo> = {}): BlocoResumo {
  return {
    id: 'bloco-sintetico',
    numero: 1,
    titulo: 'Título sintético',
    fonte: 'fonte sintética',
    corpoHtml: HTML_DO_CORPO,
    resumo: [],
    exemploHtml: '',
    figuras3d: [{ chave: 'piramide-kelsen', alvo: 'figura-sintetica', dados: DADOS }],
    ...extra
  };
}

/** IntersectionObserver de mentira: o teste decide quando a figura "entra perto da tela". */
class ObservadorFalso {
  static instancias: ObservadorFalso[] = [];
  constructor(private readonly aoCruzar: (entradas: { isIntersecting: boolean }[]) => void) {
    ObservadorFalso.instancias.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  cruzar(isIntersecting: boolean): void {
    this.aoCruzar([{ isIntersecting }]);
  }
  static cruzarTodos(isIntersecting = true): void {
    for (const o of ObservadorFalso.instancias) o.cruzar(isIntersecting);
  }
}

function figuraMontadaFalsa(): FiguraMontada & {
  redimensionar: ReturnType<typeof vi.fn>;
  destruir: ReturnType<typeof vi.fn>;
} {
  return { redimensionar: vi.fn(), destruir: vi.fn() };
}

const SOM_FALSO = {
  estado: () => ({ disponivel: false, desbloqueado: false, ativo: true }),
  ouvir: () => () => undefined,
  alternar: vi.fn(),
  testar: vi.fn(),
  definirReduzido: vi.fn()
};

function motorFalso(montada = figuraMontadaFalsa()): MotorFigura & { montada: typeof montada } {
  return {
    montada,
    criarFigura: vi.fn(() => montada),
    obterSom: vi.fn(() => SOM_FALSO)
  };
}

function lojaAdaptado(ligado: boolean): { loja: StoreModoAdaptado; ligar: (v: boolean) => void } {
  const efetivo = ref(ligado);
  const loja = { efetivo } as unknown as StoreModoAdaptado;
  return { loja, ligar: (v) => (efetivo.value = v) };
}

let montado: VueWrapper | undefined;

/** Monta e espera o ciclo de montagem acabar: o Teleport defer monta o componente depois do mount. */
async function montar(opcoes: { adaptado?: boolean; bloco?: BlocoResumo } = {}) {
  const { loja, ligar } = lojaAdaptado(opcoes.adaptado ?? false);
  montado = mount(BlocoTeorico, {
    props: { bloco: opcoes.bloco ?? bloco() },
    attachTo: document.body,
    global: { provide: { [CHAVE_STORE_MODO_ADAPTADO as symbol]: loja } }
  });
  await flushPromises();
  return { ligar };
}

const figuraEl = (): HTMLElement => document.getElementById('figura-sintetica') as HTMLElement;

beforeEach(() => {
  ObservadorFalso.instancias = [];
  vi.stubGlobal('IntersectionObserver', ObservadorFalso);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 760,
    height: 400,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 760,
    bottom: 400,
    toJSON: () => ({})
  });
  ambiente.temWebGL2.mockReturnValue(true);
  ambiente.medirJanela.mockReturnValue({ largura: 1280, altura: 720 });
  ambiente.temaEscuro.mockReturnValue(false);
  carregador.carregarMotor.mockReset();
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('BlocoTeorico com figura 3d: Teleport defer dentro do HTML do v-html', () => {
  it('o componente monta DENTRO do <figure> que veio do corpoHtml (alvo achado no mesmo ciclo)', async () => {
    carregador.carregarMotor.mockResolvedValue(motorFalso());
    await montar();
    const dentro = figuraEl().querySelector('.figura-piramide3d');
    expect(dentro).not.toBeNull();
    expect(figuraEl().querySelector('.figura-piramide__plana')).not.toBeNull();
  });

  it('bloco sem figuras3d não monta nada e não procura alvo', async () => {
    await montar({ bloco: bloco({ figuras3d: undefined }) });
    expect(document.querySelector('.figura-piramide3d')).toBeNull();
    expect(carregador.carregarMotor).not.toHaveBeenCalled();
  });
});

describe('BlocoTeorico com figura 3d: quando o 3D NÃO entra', () => {
  it('controle positivo: ambiente favorável e figura perto da tela carrega o motor UMA vez e marca data-3d', async () => {
    const motor = motorFalso();
    carregador.carregarMotor.mockResolvedValue(motor);
    await montar();
    ObservadorFalso.cruzarTodos(true);
    await flushPromises();
    expect(carregador.carregarMotor).toHaveBeenCalledTimes(1);
    expect(motor.criarFigura).toHaveBeenCalledTimes(1);
    expect(figuraEl().getAttribute('data-3d')).toBe('on');
    const opcoes = (motor.criarFigura as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(opcoes.chave).toBe('piramide-kelsen');
    expect(opcoes.dados).toEqual(DADOS);
    expect(figuraEl().contains(opcoes.palco)).toBe(true);
  });

  it('enquanto a figura está longe da tela, o motor não é carregado', async () => {
    carregador.carregarMotor.mockResolvedValue(motorFalso());
    await montar();
    await flushPromises();
    expect(carregador.carregarMotor).not.toHaveBeenCalled();
    expect(figuraEl().hasAttribute('data-3d')).toBe(false);
  });

  it('sem WebGL2: a plana fica, o motor não é importado e o figure não ganha data-3d', async () => {
    ambiente.temWebGL2.mockReturnValue(false);
    carregador.carregarMotor.mockResolvedValue(motorFalso());
    await montar();
    ObservadorFalso.cruzarTodos(true);
    await flushPromises();
    expect(carregador.carregarMotor).not.toHaveBeenCalled();
    expect(figuraEl().hasAttribute('data-3d')).toBe(false);
    expect(figuraEl().querySelector('.figura-piramide__plana')).not.toBeNull();
  });

  it('modo adaptado ligado: a plana fica, o motor não é importado e o figure não ganha data-3d', async () => {
    carregador.carregarMotor.mockResolvedValue(motorFalso());
    await montar({ adaptado: true });
    ObservadorFalso.cruzarTodos(true);
    await flushPromises();
    expect(carregador.carregarMotor).not.toHaveBeenCalled();
    expect(figuraEl().hasAttribute('data-3d')).toBe(false);
  });

  it('janela pequena: a plana fica e o motor não é importado', async () => {
    ambiente.medirJanela.mockReturnValue({ largura: 800, altura: 500 });
    carregador.carregarMotor.mockResolvedValue(motorFalso());
    await montar();
    ObservadorFalso.cruzarTodos(true);
    await flushPromises();
    expect(carregador.carregarMotor).not.toHaveBeenCalled();
    expect(figuraEl().hasAttribute('data-3d')).toBe(false);
  });

  it('figura estreita (menos de 560 px): a plana fica e o motor não é importado', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 400
    } as DOMRect);
    carregador.carregarMotor.mockResolvedValue(motorFalso());
    await montar();
    ObservadorFalso.cruzarTodos(true);
    await flushPromises();
    expect(carregador.carregarMotor).not.toHaveBeenCalled();
  });

  it('o motor que falha ao carregar deixa a plana, sem erro e sem data-3d', async () => {
    carregador.carregarMotor.mockRejectedValue(new Error('pedaço não chegou'));
    await montar();
    ObservadorFalso.cruzarTodos(true);
    await flushPromises();
    expect(figuraEl().hasAttribute('data-3d')).toBe(false);
  });

  it('o motor que não consegue criar o contexto (criarFigura devolve null) deixa a plana', async () => {
    const motor = motorFalso();
    (motor.criarFigura as ReturnType<typeof vi.fn>).mockReturnValue(null);
    carregador.carregarMotor.mockResolvedValue(motor);
    await montar();
    ObservadorFalso.cruzarTodos(true);
    await flushPromises();
    expect(motor.criarFigura).toHaveBeenCalledTimes(1);
    expect(figuraEl().hasAttribute('data-3d')).toBe(false);
  });
});

describe('BlocoTeorico com figura 3d: o 3D sai e a plana volta', () => {
  it('ligar o modo adaptado com o 3D montado destrói a figura e tira o data-3d', async () => {
    const motor = motorFalso();
    carregador.carregarMotor.mockResolvedValue(motor);
    const { ligar } = await montar();
    ObservadorFalso.cruzarTodos(true);
    await flushPromises();
    expect(figuraEl().getAttribute('data-3d')).toBe('on');
    ligar(true);
    await nextTick();
    await flushPromises();
    expect(motor.montada.destruir).toHaveBeenCalledTimes(1);
    expect(figuraEl().hasAttribute('data-3d')).toBe(false);
  });

  it('desmontar o bloco destrói a figura 3d', async () => {
    const motor = motorFalso();
    carregador.carregarMotor.mockResolvedValue(motor);
    await montar();
    ObservadorFalso.cruzarTodos(true);
    await flushPromises();
    montado?.unmount();
    montado = undefined;
    expect(motor.montada.destruir).toHaveBeenCalledTimes(1);
  });

  it('o 3D que chega depois de a janela já ter ficado pequena não monta', async () => {
    let entrega: (m: MotorFigura) => void = () => undefined;
    const motor = motorFalso();
    carregador.carregarMotor.mockReturnValue(new Promise<MotorFigura>((r) => (entrega = r)));
    await montar();
    ObservadorFalso.cruzarTodos(true);
    ambiente.medirJanela.mockReturnValue({ largura: 700, altura: 500 });
    window.dispatchEvent(new Event('resize'));
    entrega(motor);
    await flushPromises();
    expect(motor.criarFigura).not.toHaveBeenCalled();
    expect(figuraEl().hasAttribute('data-3d')).toBe(false);
    // O componente não pode ficar visível e vazio: a plana é o que aparece.
    expect(figuraEl().querySelector('.figura-piramide3d')?.hasAttribute('hidden')).toBe(true);
  });
});
