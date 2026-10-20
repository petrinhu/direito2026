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
 * Integração do selo (ordem do líder, 20/10/2026): o LayoutBase decide se a
 * página é a inicial e a repassa à barra do topo. O selo aparece dentro da
 * barra fora da home e some na home; o círculo Home de baixo segue como era
 * (aparece fora da home, some na home) e não é tocado por esta mudança.
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

describe('LayoutBase, selo da Home na barra do topo', () => {
  it('página interna: o selo aparece dentro da barra do topo', () => {
    montado = montarLayout('p/p1/intr-direito');
    expect(document.querySelector('.barra-topo .selo-home')).not.toBeNull();
  });

  it('página inicial: a barra do topo não tem selo', () => {
    montado = montarLayout('');
    expect(document.querySelector('.barra-topo .selo-home')).toBeNull();
  });

  it('página interna: o círculo Home de baixo continua na pilha inferior', () => {
    montado = montarLayout('p/p1/intr-direito');
    const pilha = document.querySelector('.layout-base__inferior');
    expect(pilha?.querySelector('.botao-home')).not.toBeNull();
  });

  it('página interna: o círculo Home de baixo não foi para dentro da barra do topo', () => {
    montado = montarLayout('p/p1/intr-direito');
    expect(document.querySelector('.barra-topo .botao-home')).toBeNull();
  });
});
