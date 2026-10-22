// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@vue/compiler-sfc';
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';
import { roteadorDeTeste } from '../apoio/roteadorDeTeste';

/**
 * Estilo e navegação do menu lateral (QA, docs/qa-menu-lateral.md, seções 6 e 7).
 *
 * 1. Estilo: o `<style scoped>` do MenuCurriculo não alcançava os nós do
 *    componente MenuUnidadeComAbas (378 de 512 nós sem o atributo de escopo),
 *    então escada, alvos, hover e cursor se perderam. O estilo passa a ser
 *    global, com todo seletor prefixado pelo menu, e não há mais :deep().
 * 2. Navegação: todo link do menu é RouterLink, então o clique troca a rota no
 *    roteador sem recarregar a página (um <a href> simples recarregava tudo, e
 *    a cadeia aberta à mão se perdia).
 *
 * jsdom não aplica CSS escopado: a prova do estilo é a do SFC compilado (o
 * descritor do bloco), e a da navegação é a rota do roteador depois do clique.
 */
const pastaDosComponentes = resolve(__dirname, '../../src/ui/componentes');
const fonteMenu = readFileSync(resolve(pastaDosComponentes, 'MenuCurriculo.vue'), 'utf-8');
const fonteAbas = readFileSync(resolve(pastaDosComponentes, 'MenuUnidadeComAbas.vue'), 'utf-8');

function estiloDe(fonte: string) {
  const { descriptor, errors } = parse(fonte, { filename: 'x.vue' });
  expect(errors).toEqual([]);
  return descriptor.styles[0]!;
}

function templateDe(fonte: string): string {
  const { descriptor } = parse(fonte, { filename: 'x.vue' });
  return descriptor.template?.content ?? '';
}

describe('MenuCurriculo, estilo alcança o componente das abas', () => {
  it('o bloco de estilo do menu não é scoped (o filho MenuUnidadeComAbas herda as regras)', () => {
    expect(estiloDe(fonteMenu).scoped).toBeFalsy();
  });

  it('nenhuma regra usa :deep(), que só existe em estilo scoped', () => {
    expect(estiloDe(fonteMenu).content).not.toMatch(/:deep\(/);
  });

  it('todo seletor começa pelo prefixo do menu ou por :root: nada vaza para a página', () => {
    const conteudo = estiloDe(fonteMenu).content.replace(/\/\*[\s\S]*?\*\//g, '');
    const cabecalhos = [...conteudo.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1]!.trim())
      .filter((t) => !t.startsWith('@') && t !== '');
    for (const cabecalho of cabecalhos) {
      for (const seletor of cabecalho
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)) {
        expect(
          seletor.startsWith('.menu-curriculo') || seletor.startsWith(':root'),
          `seletor sem prefixo do menu: ${seletor}`
        ).toBe(true);
      }
    }
  });
});

describe('MenuCurriculo, links do menu são RouterLink (sem recarregar a página)', () => {
  it('o template do menu não tem nenhum <a> simples', () => {
    expect(templateDe(fonteMenu)).not.toMatch(/<a[\s>]/);
  });

  it('o template do componente das abas não tem nenhum <a> simples', () => {
    expect(templateDe(fonteAbas)).not.toMatch(/<a[\s>]/);
  });

  it('clicar no rótulo de uma unidade troca a rota pelo roteador (navegação sem recarregar)', async () => {
    await roteadorDeTeste.push('/');
    const curriculo: Curriculo = [
      {
        id: 'p1',
        numero: 1,
        rotulo: '1º período',
        cadeiras: [
          {
            id: 'intr',
            nome: 'Introdução',
            estado: 'publicado',
            unidades: [
              { id: 'u1', rotulo: 'Unidade 1', titulo: 'U1', estado: 'publicado', abas: ['resumo'] }
            ]
          }
        ]
      }
    ];
    // Navegação real: o roteador de teste é instalado só aqui, e o stub de RouterLink é desligado.
    const wrapper = mount(MenuCurriculo, {
      props: { curriculo, caminhoAtual: '' },
      global: { plugins: [roteadorDeTeste], stubs: { RouterLink: false } }
    });
    await wrapper.find('button[aria-expanded]').trigger('click');
    await wrapper.findAll('button[aria-expanded]')[1]!.trigger('click');
    await flushPromises();
    await wrapper.find('a[href="/p/p1/intr/u1"]').trigger('click');
    await flushPromises();
    expect(roteadorDeTeste.currentRoute.value.path).toBe('/p/p1/intr/u1');
  });
});
