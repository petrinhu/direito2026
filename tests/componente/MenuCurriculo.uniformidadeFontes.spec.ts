// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Uniformidade de fonte, tamanho e cor no menu lateral (ordem do líder,
 * 22/10/2026: "as fontes estão uniformes no menu lateral"). Itens do mesmo
 * nível e do mesmo tipo usam a mesma tipografia e a mesma cor do próprio nível
 * (--menu-cor, definido por lista). "Em breve" é o único desvio de propósito:
 * segue muted, mas com a tipografia e o recuo do nível em que está.
 *
 * jsdom não aplica CSS scoped, então a prova é a da regra no fonte, lida por
 * regex, como o spec de tipografia. O resultado em pixels é conferido em
 * navegador.
 */
const fonte = readFileSync(
  resolve(__dirname, '../../src/ui/componentes/MenuCurriculo.vue'),
  'utf-8'
);

const estilo = fonte.slice(fonte.indexOf('<style>')).replace(/\/\*[\s\S]*?\*\//g, '');
const regras = [...estilo.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  seletor: m[1]!.trim(),
  corpo: m[2]!
}));

function regrasQue(trecho: string): { seletor: string; corpo: string }[] {
  return regras.filter((r) => r.seletor.includes(trecho));
}

describe('MenuCurriculo, uniformidade no nível 3 (unidade e AV)', () => {
  it('o rótulo da AV tem o mesmo tamanho do rótulo de unidade (propriedade do nível 3)', () => {
    expect(
      regrasQue('rotulo-av').some((r) => /font-size:\s*var\(--menu-tam-3\)/.test(r.corpo))
    ).toBe(true);
  });

  it('a AV não sobrescreve a cor: herda --menu-cor do nível, como a unidade', () => {
    const botaoAv = regrasQue('menu-curriculo__toggle--av');
    expect(botaoAv.length).toBeGreaterThan(0);
    expect(botaoAv.some((r) => /color:\s*inherit/.test(r.corpo))).toBe(false);
    const botaoBase = regras.filter((r) => r.seletor === '.menu-curriculo__toggle');
    expect(botaoBase.length).toBe(1);
    expect(/color:\s*var\(--menu-cor/.test(botaoBase[0]!.corpo)).toBe(true);
  });

  it('o rótulo da AV fica centralizado na linha, como o da unidade (sem align-self no topo)', () => {
    expect(regrasQue('rotulo-av').some((r) => /align-self:\s*flex-start/.test(r.corpo))).toBe(
      false
    );
  });

  it('o "em breve" de unidade usa o tamanho do nível 3 (propriedade do nível 3)', () => {
    expect(
      regrasQue('nivel-3 > li > .menu-curriculo__linha .estado-em-breve').some((r) =>
        /font-size:\s*var\(--menu-tam-3\)/.test(r.corpo)
      )
    ).toBe(true);
  });

  it('o "em breve" de unidade fica na coluna do recuo, alinhado com os nomes das unidades', () => {
    const curriculo: Curriculo = [
      {
        id: 'p1',
        numero: 1,
        rotulo: '1º período',
        cadeiras: [
          {
            id: 'c',
            nome: 'Cadeira',
            estado: 'publicado',
            unidades: [
              {
                id: 'u1',
                rotulo: 'Unidade 1',
                titulo: 'U1',
                estado: 'publicado',
                abas: ['resumo']
              },
              { id: 'u2', rotulo: 'Unidade 2', titulo: 'U2', estado: 'em-breve', abas: [] }
            ]
          }
        ]
      }
    ];
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    const linhaEmBreve = wrapper
      .findAll('.menu-curriculo__linha')
      .find((l) => l.find('.estado-em-breve').exists());
    expect(linhaEmBreve, 'o em breve de unidade deve estar numa linha com recuo').toBeDefined();
    expect(linhaEmBreve!.find('.menu-curriculo__recuo').exists()).toBe(true);
  });
});

describe('MenuCurriculo, uniformidade no nível 2 (cadeira)', () => {
  it('o "em breve" de cadeira usa a fonte de título do nível 2 (Cormorant), fora do modo adaptado', () => {
    expect(
      regrasQue('nivel-2 > li > .estado-em-breve').some((r) =>
        /font-family:\s*var\(--fonte-titulo\)/.test(r.corpo)
      )
    ).toBe(true);
  });

  it('o link de cadeira restrita tem o mesmo recuo do rótulo da cadeira (seta de 14px, como o botão)', () => {
    expect(regrasQue('link-restrita::before').length).toBeGreaterThan(0);
    expect(
      regrasQue('link-restrita').some((r) => /padding-left:\s*var\(--esp-3/.test(r.corpo))
    ).toBe(true);
  });

  it('no modo adaptado, o link restrito e o "em breve" de cadeira ficam no tamanho das cadeiras (0.9375rem)', () => {
    const regraAdaptada = regras.filter(
      (r) =>
        r.seletor.includes('nivel-2 > li > .menu-curriculo__botao') &&
        /0\.9375rem|escala-sm/.test(r.corpo)
    );
    expect(regraAdaptada.length).toBeGreaterThan(0);
    expect(regraAdaptada.some((r) => r.seletor.includes('nivel-2 > li > a'))).toBe(true);
    expect(regraAdaptada.some((r) => r.seletor.includes('nivel-2 > li > .estado-em-breve'))).toBe(
      true
    );
  });
});

describe('MenuCurriculo, uniformidade no nível 4 e 5', () => {
  it('o "em breve" de grupo (nível 4) usa o tamanho do nível (propriedade do nível 4) e a coluna do texto dos grupos', () => {
    const regra = regrasQue('nivel-4 > li > .estado-em-breve');
    expect(regra.some((r) => /font-size:\s*var\(--menu-tam-4\)/.test(r.corpo))).toBe(true);
    expect(regra.some((r) => /padding-left:\s*calc\(var\(--menu-coluna-aba/.test(r.corpo))).toBe(
      true
    );
  });

  it('o "em breve" de tópico (nível 5) usa o tamanho do nível (propriedade do nível 5) e o recuo dos tópicos', () => {
    const regra = regrasQue('nivel-5 > li > .estado-em-breve');
    expect(regra.some((r) => /font-size:\s*var\(--menu-tam-5\)/.test(r.corpo))).toBe(true);
    expect(regra.some((r) => /padding:\s*var\(--esp-2/.test(r.corpo))).toBe(true);
  });
});
