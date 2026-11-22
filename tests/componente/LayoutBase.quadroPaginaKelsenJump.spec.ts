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
 * KELSEN-JUMP: na rota do jogo o quadro de contagem começa minimizado, sem escolha gravada, para não
 * cobrir o jogo nem a lição de fim de partida a 360 px. Nas demais rotas o quadro segue como antes.
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

describe('LayoutBase: quadro de contagem começa minimizado na página do jogo (KELSEN-JUMP)', () => {
  it('na rota kelsen-jump o quadro começa minimizado, sem escolha gravada', () => {
    const w = montarNaPagina('kelsen-jump');
    expect(w.find('.quadro-prova').classes()).toContain('quadro-prova--minimizado');
  });

  it('em outra página o quadro segue aberto, como antes', () => {
    const w = montarNaPagina('p/p1/intr-direito');
    expect(w.find('.quadro-prova').classes()).not.toContain('quadro-prova--minimizado');
  });
});
