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
 * Botão Home (ordem do líder, 20/10/2026): aparece em todas as páginas
 * menos na própria home (caminho vazio, como App.vue passa). Fica na pilha
 * inferior, abaixo do quadro de prova, e nunca dentro dele: assim nada se
 * sobrepõe, em tela larga e estreita.
 */
let montado: VueWrapper | undefined;

const curriculoVazio: Curriculo = [];

function montarLayout(caminhoAtual: string) {
  const repo = new RepositorioMemoria();
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
  vi.setSystemTime(new Date('2026-10-20T15:00:00Z'));
  window.localStorage.clear();
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('LayoutBase, botão Home fora da página inicial', () => {
  it('aparece numa página interna, dentro da pilha inferior', () => {
    montado = montarLayout('p/p1/intr-direito');
    const pilha = document.querySelector('.layout-base__inferior');
    expect(pilha?.querySelector('.botao-home')).not.toBeNull();
  });

  it('some na própria home (caminho vazio)', () => {
    montado = montarLayout('');
    expect(document.querySelector('.botao-home')).toBeNull();
  });

  it('é filho direto da pilha e nunca fica dentro do quadro de prova (não sobrepõe)', () => {
    montado = montarLayout('p/p1/intr-direito');
    const pilha = document.querySelector('.layout-base__inferior');
    const botao = pilha?.querySelector('.botao-home');
    expect(botao?.parentElement).toBe(pilha);
    expect(botao?.closest('.quadro-prova')).toBeNull();
    expect(pilha?.querySelector('.quadro-prova')).not.toBeNull();
  });
});
