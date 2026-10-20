// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BarraTopo from '@/ui/layout/BarraTopo.vue';
import { criarStoreTema } from '@/app/stores/tema';
import { criarStoreBusca } from '@/app/stores/busca';
import { criarStoreModoAdaptado } from '@/app/stores/modoAdaptado';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Selo "Caderno de Direito / HOME" no início da barra do topo (ordem do
 * líder, 20/10/2026, variante A). Fora da página inicial o selo abre a linha;
 * na própria home a barra fica exatamente como era, sem selo. Quem decide é
 * o LayoutBase, que passa `naPaginaInicial`; a barra não compara caminho.
 */
function montarBarra(naPaginaInicial: boolean) {
  const repo = new RepositorioMemoria();
  const curriculo: Curriculo = [];
  return mount(BarraTopo, {
    props: {
      curriculo,
      caminhoAtual: naPaginaInicial ? '' : 'p/p1/intr-direito',
      naPaginaInicial,
      storeTema: criarStoreTema(repo),
      storeBusca: criarStoreBusca(),
      storeModoAdaptado: criarStoreModoAdaptado(repo)
    }
  });
}

describe('BarraTopo, selo da Home fora da página inicial', () => {
  it('fora da home, mostra o selo', () => {
    const w = montarBarra(false);
    expect(w.find('.selo-home').exists()).toBe(true);
  });

  it('na home, não mostra o selo (a barra fica como era)', () => {
    const w = montarBarra(true);
    expect(w.find('.selo-home').exists()).toBe(false);
  });

  it('o selo é o primeiro item da linha, antes do ☰ e da trilha', () => {
    const w = montarBarra(false);
    const primeiro = w.find('.barra-topo__linha').element.firstElementChild;
    expect(primeiro?.classList.contains('selo-home')).toBe(true);
  });

  it('na home, a linha começa pelo ☰, como antes', () => {
    const w = montarBarra(true);
    const primeiro = w.find('.barra-topo__linha').element.firstElementChild;
    expect(primeiro?.classList.contains('barra-topo__botao-gaveta')).toBe(true);
  });

  it('fora da home, ☰ e trilha continuam presentes depois do selo', () => {
    const w = montarBarra(false);
    expect(w.find('.barra-topo__botao-gaveta').exists()).toBe(true);
    expect(w.find('nav[aria-label="Trilha de navegação"]').exists()).toBe(true);
  });

  it('o selo leva para a página inicial', () => {
    const w = montarBarra(false);
    expect(w.find('.selo-home').attributes('href')).toBe('/');
  });
});
