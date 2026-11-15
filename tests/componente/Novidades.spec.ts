// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import Novidades from '@/ui/paginas/Novidades.vue';
import { formatarData } from '@/app/versoes/paginas';

/**
 * HIST-F2 (ordem do líder de 14/11, item 62): página Novidades, didática. Título h1, uma seção por
 * versão (h2 com a versão e a data), cada alteração numa lista semântica (li). Foco no título ao abrir.
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

describe('página Novidades', () => {
  it('tem um único h1 com o nome da página', () => {
    w = mount(Novidades, { attachTo: document.body });
    const titulos = w.findAll('h1');
    expect(titulos.length).toBe(1);
    expect(titulos[0]!.text()).toBe('Novidades');
  });

  it('a página não toma o foco ao abrir: o roteador leva o foco ao conteúdo (convenção do site)', () => {
    w = mount(Novidades, { attachTo: document.body });
    expect(document.activeElement?.tagName).not.toBe('H1');
  });

  it('uma seção por versão, a mais nova primeiro, com h2 e data', () => {
    w = mount(Novidades, { attachTo: document.body });
    const secoes = w.findAll('section');
    expect(secoes.length).toBe(HISTORICO.length);
    const primeiro = w.find('h2');
    expect(primeiro.text()).toContain(MAIS_NOVA.versao);
    // A data vem do próprio histórico: a próxima publicação muda a data sem quebrar este spec.
    expect(primeiro.text()).toContain(formatarData(MAIS_NOVA.data));
  });

  it('cada alteração é um item de lista e vem do texto didático', () => {
    w = mount(Novidades, { attachTo: document.body });
    const itens = w
      .find('section')
      .findAll('li')
      .map((li) => li.text());
    expect(itens).toEqual(MAIS_NOVA.didatico);
  });
  it('cada seção aponta, por aria-labelledby, para o h2 dela (não para outro elemento)', () => {
    w = mount(Novidades, { attachTo: document.body });
    for (const secao of w.findAll('section')) {
      const id = secao.attributes('aria-labelledby');
      expect(id, 'aria-labelledby').toBeTruthy();
      expect(secao.find(`#${id}`).element.tagName).toBe('H2');
    }
  });

  it('as alterações estão numa lista (ul com li), não em blocos soltos', () => {
    w = mount(Novidades, { attachTo: document.body });
    for (const secao of w.findAll('section')) {
      expect(secao.find('ul').exists()).toBe(true);
      expect(secao.findAll('ul > li').length).toBeGreaterThan(0);
    }
  });

  it('com um histórico inválido, a página não mostra versões e diz que não carregou', () => {
    w = mount(Novidades, {
      attachTo: document.body,
      props: { origem: [{ versao: 'x', data: '2026-11-15', didatico: ['a'], tecnico: ['b'] }] }
    });
    expect(w.findAll('section').length).toBe(0);
    expect(w.text()).toContain('Não foi possível carregar as novidades agora.');
  });
});
