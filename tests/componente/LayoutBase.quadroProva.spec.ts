// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import LayoutBase from '@/ui/layout/LayoutBase.vue';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Quadro de contagem em todas as páginas (ordem do líder, 20/10/2026), na pilha inferior com
 * position: sticky. O aviso de armazenamento não fica mais nessa pilha: é um bloco no topo do
 * conteúdo que rola com a página (decisão do líder, 07/11/2026).
 */
let montado: VueWrapper | undefined;

const curriculoVazio: Curriculo = [];

function montarLayout() {
  const repo = new RepositorioMemoria();
  return mount(LayoutBase, {
    props: {
      curriculo: curriculoVazio,
      caminhoAtual: 'p/p1/intr-direito',
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

describe('LayoutBase, quadro de contagem em todas as páginas', () => {
  it('o quadro aparece na pilha inferior, e o aviso de armazenamento fica no topo do conteúdo', () => {
    montado = montarLayout();
    const pilha = document.querySelector('.layout-base__inferior');
    expect(pilha).not.toBeNull();
    expect(pilha?.querySelector('.quadro-prova')).not.toBeNull();
    expect(pilha?.querySelector('.aviso-armazenamento')).toBeNull();
    const principal = document.querySelector('#conteudo-principal');
    expect(principal?.querySelector('.aviso-armazenamento')).not.toBeNull();
  });

  it('a pilha inferior é sticky, não fixed (não cobre o fim da página)', () => {
    const fonte = readFileSync(resolve(__dirname, '../../src/ui/layout/LayoutBase.vue'), 'utf-8');
    const regra = /\.layout-base__inferior\s*\{([^}]*)\}/.exec(fonte)?.[1] ?? '';
    expect(regra).toMatch(/position:\s*sticky/);
    expect(regra).not.toMatch(/position:\s*fixed/);
    expect(regra).toMatch(/bottom:\s*var\(--esp-4,\s*1rem\)/);
  });

  it('a pilha deixa passar cliques pelo vão e reativa só os filhos', () => {
    const fonte = readFileSync(resolve(__dirname, '../../src/ui/layout/LayoutBase.vue'), 'utf-8');
    const regra = /\.layout-base__inferior\s*\{([^}]*)\}/.exec(fonte)?.[1] ?? '';
    expect(regra).toMatch(/pointer-events:\s*none/);
    expect(fonte).toMatch(/\.layout-base__inferior\s*>\s*\*\s*\{[^}]*pointer-events:\s*auto/);
  });
});
