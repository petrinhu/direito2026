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
  it('tem um único h1 com o nome da página e não toma o foco ao abrir', () => {
    w = mount(Changelog, { attachTo: document.body });
    expect(w.findAll('h1').map((h) => h.text())).toEqual(['Changelog']);
    expect(document.activeElement?.tagName).not.toBe('H1');
  });

  it('cada alteração da versão mais nova é um item técnico', () => {
    w = mount(Changelog, { attachTo: document.body });
    const itens = w
      .find('section')
      .findAll('li')
      .map((li) => li.text());
    expect(itens).toEqual(MAIS_NOVA.tecnico);
  });
  it('uma seção por versão, com h2 (não h3) para o título de cada versão', () => {
    w = mount(Changelog, { attachTo: document.body });
    expect(w.findAll('h2').length).toBe(HISTORICO.length);
    expect(w.findAll('h3').length).toBe(0);
  });

  it('cada seção aponta, por aria-labelledby, para o h2 dela e tem a lista de alterações', () => {
    w = mount(Changelog, { attachTo: document.body });
    for (const secao of w.findAll('section')) {
      const id = secao.attributes('aria-labelledby');
      expect(secao.find(`#${id}`).element.tagName).toBe('H2');
      expect(secao.findAll('ul > li').length).toBeGreaterThan(0);
    }
  });

  it('com um histórico inválido, a página diz que não carregou', () => {
    w = mount(Changelog, {
      attachTo: document.body,
      props: { origem: [{ versao: 'x', data: '2026-11-15', didatico: ['a'], tecnico: ['b'] }] }
    });
    expect(w.findAll('section').length).toBe(0);
    expect(w.text()).toContain('Não foi possível carregar o registro técnico agora.');
  });
});
