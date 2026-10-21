// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import QuadroProva from '@/ui/componentes/QuadroProva.vue';
import { contadorProva } from '@/app/calendario/contadorProva';
import { gravarEscolha, CHAVE_ESTADO_QUADRO_PROVA } from '@/app/calendario/estadoQuadroProva';

/**
 * Quadro "Faltam N dias" começa minimizado na página do calendário (decisão do
 * orquestrador, modo autônomo, para ratificação pelo líder, 20/10/2026). Ali ele
 * repete o que o calendário já mostra e, aberto, cobre ANTERIOR, HOJE e PRÓXIMO
 * (QA: PRÓXIMO não clicável a 1280 e 1024 no adaptado). O padrão reaproveita o
 * mesmo mecanismo do padrão minimizado de telas estreitas: sem escolha gravada,
 * começa minimizado; se a pessoa tocar em Mostrar, a escolha vale e é gravada.
 *
 * Nasce vermelho: o quadro não tinha a prop minimizadoPorPadrao.
 */
const AGORA_20_10 = new Date('2026-10-20T15:00:00Z');

let montado: VueWrapper | undefined;

function montar(minimizadoPorPadrao: boolean): VueWrapper {
  montado = mount(QuadroProva, {
    props: { agora: AGORA_20_10, minimizadoPorPadrao },
    attachTo: document.body
  });
  return montado;
}

function minimizado(w: VueWrapper): boolean {
  return w.find('.quadro-prova').classes().includes('quadro-prova--minimizado');
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined
  }));
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('data-modo-adaptado');
  document.body.replaceChildren();
});

describe('QuadroProva na página do calendário: começa minimizado sem escolha', () => {
  it('com o padrão da página ligado e sem escolha gravada, começa minimizado (tela larga, modo normal)', () => {
    const w = montar(true);
    expect(minimizado(w)).toBe(true);
    expect(w.find('button[aria-expanded]').attributes('aria-expanded')).toBe('false');
  });

  it('sem o padrão da página (fora do calendário), o quadro segue aberto como antes', () => {
    const w = montar(false);
    expect(minimizado(w)).toBe(false);
  });

  it('se a pessoa tocou em Mostrar na faixa atual, a escolha vale e o quadro abre na página do calendário', () => {
    const faixa = contadorProva(AGORA_20_10)?.faixa;
    expect(faixa, 'faixa de urgência para a data de teste').toBeDefined();
    gravarEscolha(window.localStorage, faixa!, false);
    const w = montar(true);
    expect(minimizado(w)).toBe(false);
  });

  it('a escolha gravada usa a mesma chave de sempre (não cria um segundo estado)', () => {
    const faixa = contadorProva(AGORA_20_10)?.faixa;
    gravarEscolha(window.localStorage, faixa!, true);
    expect(window.localStorage.getItem(CHAVE_ESTADO_QUADRO_PROVA)).not.toBeNull();
  });
});
