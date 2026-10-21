// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import QuadroProva from '@/ui/componentes/QuadroProva.vue';
import { CHAVE_ESTADO_QUADRO_PROVA } from '@/app/calendario/estadoQuadroProva';

/**
 * Quadro já minimizado no modo adaptado em telas de até 340px (decisão do
 * líder, 20/10/2026: "nessa tela [320 px] e com a leitura ampliada ligada, o
 * quadro começa minimizado e só abre se a pessoa tocar em 'Mostrar'. A letra
 * continua grande."). Sem escolha gravada, o padrão é minimizado nesse caso;
 * com escolha gravada, vale a escolha; fora desse caso, nada muda.
 *
 * O modo é lido do atributo data-modo-adaptado no <html> (o mesmo que o
 * MapaMentalVisor usa); a largura, de matchMedia. Os dois reagem a mudança
 * com a página aberta.
 */
const AGORA_20_10 = new Date('2026-10-20T15:00:00Z');

interface LarguraSimulada {
  mudar(estreito: boolean): void;
}

/** matchMedia de mentira: responde só à consulta de até 340px e avisa os ouvintes. */
function larguraSimulada(estreitoInicial: boolean): LarguraSimulada {
  const ouvintes = new Set<() => void>();
  let estreito = estreitoInicial;
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query.includes('max-width: 340px') ? estreito : false;
    },
    media: query,
    addEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.add(ouvinte),
    removeEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.delete(ouvinte),
    addListener: (ouvinte: () => void) => ouvintes.add(ouvinte),
    removeListener: (ouvinte: () => void) => ouvintes.delete(ouvinte)
  }));
  return {
    mudar(novo: boolean) {
      estreito = novo;
      ouvintes.forEach((ouvinte) => ouvinte());
    }
  };
}

function ligarModoAdaptado(ligado: boolean): void {
  if (ligado) document.documentElement.setAttribute('data-modo-adaptado', 'on');
  else document.documentElement.removeAttribute('data-modo-adaptado');
}

/** Espera as observações pendentes do DOM (MutationObserver roda em microtarefa). */
function aguardarObservadores(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function montar(): VueWrapper {
  return mount(QuadroProva, { props: { agora: AGORA_20_10 }, attachTo: document.body });
}

function minimizado(w: VueWrapper): boolean {
  return w.find('.quadro-prova').classes().includes('quadro-prova--minimizado');
}

let montado: VueWrapper | undefined;

beforeEach(() => {
  window.localStorage.clear();
  ligarModoAdaptado(false);
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  vi.unstubAllGlobals();
  ligarModoAdaptado(false);
  document.body.innerHTML = '';
});

describe('QuadroProva, modo adaptado até 340px: começa minimizado sem escolha', () => {
  it('modo ligado e tela de até 340px, sem escolha gravada: começa minimizado', () => {
    larguraSimulada(true);
    ligarModoAdaptado(true);
    montado = montar();
    expect(minimizado(montado)).toBe(true);
    expect(montado.find('button[aria-expanded]').attributes('aria-expanded')).toBe('false');
    expect(montado.find('button[aria-expanded]').text()).toContain('Mostrar');
  });

  it('com a escolha de mostrar gravada, abre mesmo nessa tela', () => {
    larguraSimulada(true);
    ligarModoAdaptado(true);
    window.localStorage.setItem(
      CHAVE_ESTADO_QUADRO_PROVA,
      JSON.stringify({ minimizado: false, faixa: 'calmo', escolha: true })
    );
    montado = montar();
    expect(minimizado(montado)).toBe(false);
  });

  it('com a escolha de minimizar gravada, continua minimizado', () => {
    larguraSimulada(true);
    ligarModoAdaptado(true);
    window.localStorage.setItem(
      CHAVE_ESTADO_QUADRO_PROVA,
      JSON.stringify({ minimizado: true, faixa: 'calmo', escolha: true })
    );
    montado = montar();
    expect(minimizado(montado)).toBe(true);
  });

  it('tocar em Mostrar grava a escolha: na próxima montagem o quadro nasce aberto', async () => {
    larguraSimulada(true);
    ligarModoAdaptado(true);
    montado = montar();
    await montado.find('button[aria-expanded]').trigger('click');
    expect(minimizado(montado)).toBe(false);
    montado.unmount();
    montado = montar();
    expect(minimizado(montado)).toBe(false);
  });

  it('a escolha gravada de mostrar vale mesmo se a tela alargar e voltar a estreitar', async () => {
    const largura = larguraSimulada(true);
    ligarModoAdaptado(true);
    montado = montar();
    await montado.find('button[aria-expanded]').trigger('click');
    largura.mudar(false);
    largura.mudar(true);
    await montado.vm.$nextTick();
    expect(minimizado(montado)).toBe(false);
  });
});

describe('QuadroProva, fora do caso (nada muda)', () => {
  it('modo adaptado ligado em tela larga, sem escolha: começa aberto', () => {
    larguraSimulada(false);
    ligarModoAdaptado(true);
    montado = montar();
    expect(minimizado(montado)).toBe(false);
  });

  it('modo desligado em tela de até 340px, sem escolha: começa aberto', () => {
    larguraSimulada(true);
    ligarModoAdaptado(false);
    montado = montar();
    expect(minimizado(montado)).toBe(false);
  });

  it('sem matchMedia (ambiente sem a API), com modo ligado: começa aberto', () => {
    ligarModoAdaptado(true);
    montado = montar();
    expect(minimizado(montado)).toBe(false);
  });

  it('minimizar e mostrar continuam funcionando normalmente fora do caso', async () => {
    larguraSimulada(false);
    montado = montar();
    await montado.find('button[aria-expanded]').trigger('click');
    expect(minimizado(montado)).toBe(true);
    await montado.find('button[aria-expanded]').trigger('click');
    expect(minimizado(montado)).toBe(false);
  });
});

describe('QuadroProva, reage com a página aberta', () => {
  it('ligar o modo adaptado com a página aberta, em tela estreita, minimiza o quadro', async () => {
    larguraSimulada(true);
    montado = montar();
    expect(minimizado(montado)).toBe(false);
    ligarModoAdaptado(true);
    await aguardarObservadores();
    await montado.vm.$nextTick();
    expect(minimizado(montado)).toBe(true);
  });

  it('a tela passar a ser estreita com o modo ligado minimiza o quadro', async () => {
    const largura = larguraSimulada(false);
    ligarModoAdaptado(true);
    montado = montar();
    expect(minimizado(montado)).toBe(false);
    largura.mudar(true);
    await montado.vm.$nextTick();
    expect(minimizado(montado)).toBe(true);
  });
});
