// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import Novidades from '@/ui/paginas/Novidades.vue';

/**
 * HIST-F2 (ordem do líder de 14/11, item 62): página Novidades, didática. Título h1, uma seção por
 * versão (h2 com a versão e a data), cada alteração numa lista semântica (li). Foco no título ao abrir.
 */
const HISTORICO = JSON.parse(readFileSync(resolve(__dirname, '../../src/dados/versoes/historico.json'), 'utf-8'));
const MAIS_NOVA = [...HISTORICO].reverse()[0];

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = '';
});

describe('página Novidades', () => {
  it('tem um único h1 com o nome da página', () => {
    w = mount(Novidades, { attachTo: document.body });
    const titulos = w.findAll('h1');
    expect(titulos.length).toBe(1);
    expect(titulos[0]!.text()).toBe('Novidades');
  });

  it('o título recebe o foco quando a página abre', () => {
    w = mount(Novidades, { attachTo: document.body });
    expect(document.activeElement?.tagName).toBe('H1');
  });

  it('uma seção por versão, a mais nova primeiro, com h2 e data', () => {
    w = mount(Novidades, { attachTo: document.body });
    const secoes = w.findAll('section');
    expect(secoes.length).toBe(HISTORICO.length);
    const primeiro = w.find('h2');
    expect(primeiro.text()).toContain(MAIS_NOVA.versao);
    expect(primeiro.text()).toContain('15/11/2026');
  });

  it('cada alteração é um item de lista e vem do texto didático', () => {
    w = mount(Novidades, { attachTo: document.body });
    const itens = w.find('section').findAll('li').map((li) => li.text());
    expect(itens).toEqual(MAIS_NOVA.didatico);
  });
});
