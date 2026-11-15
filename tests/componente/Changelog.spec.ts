// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import Changelog from '@/ui/paginas/Changelog.vue';

/**
 * HIST-F2: página Changelog, técnica. Mesma estrutura da Novidades, com o texto técnico de cada versão.
 */
const HISTORICO = JSON.parse(
  readFileSync(resolve(__dirname, '../../src/dados/versoes/historico.json'), 'utf-8')
);
const MAIS_NOVA = [...HISTORICO].reverse()[0];

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = '';
});

describe('página Changelog', () => {
  it('tem um único h1 com o nome da página e o foco nele ao abrir', () => {
    w = mount(Changelog, { attachTo: document.body });
    expect(w.findAll('h1').map((h) => h.text())).toEqual(['Changelog']);
    expect(document.activeElement?.tagName).toBe('H1');
  });

  it('cada alteração da versão mais nova é um item técnico', () => {
    w = mount(Changelog, { attachTo: document.body });
    const itens = w
      .find('section')
      .findAll('li')
      .map((li) => li.text());
    expect(itens).toEqual(MAIS_NOVA.tecnico);
  });
});
