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
 * O layout diz ao quadro de contagem que a página é o calendário (caminhoAtual
 * "calendario", sem barra, como o App.vue passa). Só ali o quadro começa
 * minimizado, sem escolha gravada. Nas outras páginas, segue aberto.
 */
let montado: VueWrapper | undefined;

function montarNaPagina(caminhoAtual: string) {
  const repo = new RepositorioMemoria();
  montado = mount(LayoutBase, {
    props: {
      curriculo: [] as Curriculo,
      caminhoAtual,
      repositorio: repo,
      storeTema: criarStoreTema(repo),
      storeBusca: criarStoreBusca(),
      storeModoAdaptado: criarStoreModoAdaptado(repo)
    },
    slots: { default: () => 'conteúdo da página' },
    attachTo: document.body
  });
  return montado;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-20T15:00:00Z'));
  window.localStorage.clear();
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe('LayoutBase: quadro de contagem começa minimizado só na página do calendário', () => {
  it('na página do calendário o quadro começa minimizado, sem escolha gravada', () => {
    const w = montarNaPagina('calendario');
    expect(w.find('.quadro-prova').classes()).toContain('quadro-prova--minimizado');
  });

  it('em outra página o quadro segue aberto, como antes', () => {
    const w = montarNaPagina('p/p1/intr-direito');
    expect(w.find('.quadro-prova').classes()).not.toContain('quadro-prova--minimizado');
  });
});
