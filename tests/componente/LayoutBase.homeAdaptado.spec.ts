// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import LayoutBase from '@/ui/layout/LayoutBase.vue';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Botão Home no modo adaptado (regressão de 24/11/2026): fora da pilha inferior sticky, logo depois do
 * cartão de prova, dentro da coluna de conteúdo. Fora do modo adaptado a pilha não muda. O efeito de
 * sobreposição é medido em tests/e2e/home-adaptado-sem-cobrir.spec.ts (jsdom não tem layout).
 */
let montado: VueWrapper | undefined;

const curriculoVazio: Curriculo = [];

function montarLayout(modoAdaptado: boolean, caminhoAtual = 'p/p1/intr-direito') {
  const repo = new RepositorioMemoria();
  repo.salvarModoAdaptado(modoAdaptado);
  return mount(LayoutBase, {
    props: {
      curriculo: curriculoVazio,
      caminhoAtual,
      repositorio: repo,
      storeTema: criarStoreTema(repo),
      storeBusca: criarStoreBusca(),
      storeModoAdaptado: criarStoreModoAdaptado(repo)
    },
    slots: { default: () => 'conteúdo da página' },
    attachTo: document.body
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-25T15:00:00Z'));
  window.localStorage.clear();
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('LayoutBase, botão Home no modo adaptado', () => {
  it('no modo adaptado o Home sai da pilha inferior e fica dentro de main', () => {
    montado = montarLayout(true);
    const home = document.querySelector('.botao-home');
    expect(home).not.toBeNull();
    expect(home?.closest('.layout-base__inferior')).toBeNull();
    expect(home?.closest('#conteudo-principal')).not.toBeNull();
  });

  it('no modo adaptado o Home é o irmão imediato seguinte do cartão de prova', () => {
    montado = montarLayout(true);
    const cartao = document.querySelector('aside.quadro-prova');
    const home = document.querySelector('.layout-base__nav-home');
    expect(cartao).not.toBeNull();
    expect(home).not.toBeNull();
    expect(cartao?.nextElementSibling).toBe(home);
  });

  it('fora do modo adaptado o Home continua na pilha inferior, como antes', () => {
    montado = montarLayout(false);
    const pilha = document.querySelector('.layout-base__inferior');
    expect(pilha?.querySelector('.botao-home')).not.toBeNull();
    expect(document.querySelector('#conteudo-principal .botao-home')).toBeNull();
  });

  it('fora do modo adaptado o cartão de prova continua na pilha inferior', () => {
    montado = montarLayout(false);
    const pilha = document.querySelector('.layout-base__inferior');
    expect(pilha?.querySelector('aside.quadro-prova')).not.toBeNull();
  });

  it('na página inicial não há Home em nenhum modo', () => {
    montado = montarLayout(true, '');
    expect(document.querySelector('.botao-home')).toBeNull();
  });
});
