// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import QuadroProva from '@/ui/componentes/QuadroProva.vue';
import { CHAVE_ESTADO_QUADRO_PROVA } from '@/app/calendario/estadoQuadroProva';

/**
 * Abaixo de 480 px de janela, o cartão "Faltam N dias" nasce minimizado, em qualquer página e com
 * ou sem modo adaptado (decisão do líder, 21/11/2026: "Abrir minimizado no celular"). Sem escolha
 * gravada, começa minimizado. Com escolha gravada, vale a escolha, e o padrão nunca a regrava.
 * Em 480 px ou mais, nada muda: começa aberto.
 *
 * A largura é simulada por matchMedia, que responde a consultas "max-width: Npx" e avisa os ouvintes
 * quando a largura muda com a página aberta.
 */
const AGORA_20_10 = new Date('2026-10-20T15:00:00Z');

interface JanelaSimulada {
  mudar(largura: number): void;
}

function janelaSimulada(larguraInicial: number): JanelaSimulada {
  const ouvintes = new Set<() => void>();
  let largura = larguraInicial;
  vi.stubGlobal('matchMedia', (query: string) => {
    const limite = /max-width:\s*(\d+)px/.exec(query);
    return {
      get matches() {
        return limite ? largura <= Number(limite[1]) : false;
      },
      media: query,
      addEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.add(ouvinte),
      removeEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.delete(ouvinte),
      addListener: (ouvinte: () => void) => ouvintes.add(ouvinte),
      removeListener: (ouvinte: () => void) => ouvintes.delete(ouvinte)
    };
  });
  return {
    mudar(nova: number) {
      largura = nova;
      ouvintes.forEach((ouvinte) => ouvinte());
    }
  };
}

function ligarModoAdaptado(ligado: boolean): void {
  if (ligado) document.documentElement.setAttribute('data-modo-adaptado', 'on');
  else document.documentElement.removeAttribute('data-modo-adaptado');
}

/** Espera as observações pendentes do DOM e a reação do Vue. */
function aguardarReacao(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

let montado: VueWrapper | undefined;

function montar(): VueWrapper {
  montado = mount(QuadroProva, { props: { agora: AGORA_20_10 }, attachTo: document.body });
  return montado;
}

function minimizado(w: VueWrapper): boolean {
  return w.find('.quadro-prova').classes().includes('quadro-prova--minimizado');
}

function gravado(): string | null {
  return window.localStorage.getItem(CHAVE_ESTADO_QUADRO_PROVA);
}

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

describe('QuadroProva, abaixo de 480px: começa minimizado sem escolha', () => {
  it('tela de 390px, sem escolha gravada, começa minimizado', () => {
    janelaSimulada(390);
    montado = montar();
    expect(minimizado(montado)).toBe(true);
    expect(montado.find('button[aria-expanded]').attributes('aria-expanded')).toBe('false');
    expect(montado.find('button[aria-expanded]').text()).toContain('Mostrar');
  });

  it('tela de 479px começa minimizado; tela de 480px começa aberto', () => {
    janelaSimulada(479);
    montado = montar();
    expect(minimizado(montado)).toBe(true);
    montado.unmount();
    janelaSimulada(480);
    montado = montar();
    expect(minimizado(montado)).toBe(false);
  });

  it('com o modo adaptado ligado, em tela de 390px, também começa minimizado', () => {
    janelaSimulada(390);
    ligarModoAdaptado(true);
    montado = montar();
    expect(minimizado(montado)).toBe(true);
  });

  it('o padrão não grava nada no armazenamento ao nascer minimizado', () => {
    janelaSimulada(390);
    montado = montar();
    expect(minimizado(montado)).toBe(true);
    expect(gravado()).toBeNull();
  });

  it('tocar em Mostrar grava a escolha: na próxima montagem, abaixo de 480px, abre', async () => {
    janelaSimulada(390);
    montado = montar();
    await montado.find('button[aria-expanded]').trigger('click');
    expect(minimizado(montado)).toBe(false);
    montado.unmount();
    montado = montar();
    expect(minimizado(montado)).toBe(false);
  });
});

describe('QuadroProva, abaixo de 480px: a escolha gravada vale e não é sobrescrita', () => {
  it('escolha gravada de Mostrar abre mesmo abaixo de 480px', () => {
    janelaSimulada(390);
    window.localStorage.setItem(
      CHAVE_ESTADO_QUADRO_PROVA,
      JSON.stringify({ minimizado: false, faixa: 'calmo', escolha: true })
    );
    montado = montar();
    expect(minimizado(montado)).toBe(false);
  });

  it('escolha gravada de Minimizar continua minimizada', () => {
    janelaSimulada(390);
    window.localStorage.setItem(
      CHAVE_ESTADO_QUADRO_PROVA,
      JSON.stringify({ minimizado: true, faixa: 'calmo', escolha: true })
    );
    montado = montar();
    expect(minimizado(montado)).toBe(true);
  });

  it('a escolha gravada não muda ao estreitar e alargar a tela', async () => {
    const janela = janelaSimulada(390);
    const antes = JSON.stringify({ minimizado: false, faixa: 'calmo', escolha: true });
    window.localStorage.setItem(CHAVE_ESTADO_QUADRO_PROVA, antes);
    montado = montar();
    janela.mudar(1024);
    await aguardarReacao();
    janela.mudar(390);
    await aguardarReacao();
    expect(minimizado(montado)).toBe(false);
    expect(gravado()).toBe(antes);
  });
});

describe('QuadroProva, reage à largura com a página aberta', () => {
  it('a tela passar a ser estreita (abaixo de 480px), sem escolha, minimiza o quadro', async () => {
    const janela = janelaSimulada(1024);
    montado = montar();
    expect(minimizado(montado)).toBe(false);
    janela.mudar(390);
    await aguardarReacao();
    await montado.vm.$nextTick();
    expect(minimizado(montado)).toBe(true);
  });

  it('a tela voltar a ser larga, sem escolha, abre o quadro de novo', async () => {
    const janela = janelaSimulada(390);
    montado = montar();
    expect(minimizado(montado)).toBe(true);
    janela.mudar(1024);
    await aguardarReacao();
    await montado.vm.$nextTick();
    expect(minimizado(montado)).toBe(false);
  });
});

describe('QuadroProva, fora do caso: nada muda', () => {
  it('a 1024px, sem escolha, começa aberto', () => {
    janelaSimulada(1024);
    montado = montar();
    expect(minimizado(montado)).toBe(false);
  });

  it('minimizar e mostrar continuam funcionando normalmente em tela larga', async () => {
    janelaSimulada(1024);
    montado = montar();
    await montado.find('button[aria-expanded]').trigger('click');
    expect(minimizado(montado)).toBe(true);
    await montado.find('button[aria-expanded]').trigger('click');
    expect(minimizado(montado)).toBe(false);
  });
});
