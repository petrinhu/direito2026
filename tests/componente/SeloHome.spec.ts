// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import SeloHome from '@/ui/componentes/SeloHome.vue';

/**
 * Selo "Caderno de Direito / HOME" (ordem do líder, 20/10/2026, variante A do
 * protótipo mockups/selo-home.html): pílula azul-marinha com contorno dourado,
 * templo à esquerda e, à direita dele, o nome do caderno e a palavra HOME
 * centralizados. Fica no início da barra do topo, fora da página inicial.
 *
 * O CSS é travado no arquivo-fonte (jsdom roda sem a cascata), no mesmo
 * padrão de BotaoHome.spec.ts. Comentários são retirados antes, para que um
 * texto explicativo não passe por regra.
 */
const fonteBruta = readFileSync(
  resolve(__dirname, '../../src/ui/componentes/SeloHome.vue'),
  'utf-8'
);
const fonte = fonteBruta.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

/** Corpo do primeiro bloco cujo seletor (sem contar o que vem depois) casa com `seletor`. */
function corpoDoSeletor(seletor: string): string {
  const escapado = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const achado = fonte.match(new RegExp(`(?:^|\\n)${escapado}\\s*\\{([^}]*)\\}`));
  return achado?.[1] ?? '';
}

describe('SeloHome, marcação', () => {
  it('é um link para a raiz do site', () => {
    const w = mount(SeloHome);
    expect(w.find('a').attributes('href')).toBe('/');
  });

  it('tem nome acessível "Caderno de Direito, página inicial"', () => {
    const w = mount(SeloHome);
    expect(w.find('a').attributes('aria-label')).toBe('Caderno de Direito, página inicial');
  });

  it('mostra o nome do caderno no título e HOME logo abaixo', () => {
    const w = mount(SeloHome);
    expect(w.find('.selo-home__titulo').text()).toBe('Caderno de Direito');
    expect(w.find('.selo-home__rotulo').text()).toBe('HOME');
  });

  it('o texto fica dentro da coluna à direita do templo', () => {
    const w = mount(SeloHome);
    const texto = w.find('.selo-home__texto');
    expect(texto.find('.selo-home__titulo').exists()).toBe(true);
    expect(texto.find('.selo-home__rotulo').exists()).toBe(true);
    expect(w.find('.selo-home__templo').exists()).toBe(true);
  });

  it('desenha o mesmo templo do círculo da Home (5 caminhos)', () => {
    const w = mount(SeloHome);
    expect(w.findAll('svg path')).toHaveLength(5);
  });

  it('o desenho do templo é decorativo (aria-hidden e fora do foco)', () => {
    const w = mount(SeloHome);
    const svg = w.find('svg');
    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.attributes('focusable')).toBe('false');
  });

  it('não tem nenhum botão: é só navegação', () => {
    const w = mount(SeloHome);
    expect(w.find('button').exists()).toBe(false);
  });
});

describe('SeloHome, forma e tamanhos', () => {
  it('pílula: raio grande o bastante para as laterais serem em arco', () => {
    expect(corpoDoSeletor('.selo-home')).toMatch(/border-radius:\s*999px/);
  });

  it('computador: 60px de altura, com min-height (o texto nunca é cortado)', () => {
    expect(fonte).toMatch(/--selo-altura:\s*60px/);
    expect(corpoDoSeletor('.selo-home')).toMatch(/min-height:\s*var\(--selo-altura\)/);
    expect(corpoDoSeletor('.selo-home')).not.toMatch(/(^|;|\s)height:/);
  });

  it('celular (até 640px): 48px de altura', () => {
    expect(fonte).toMatch(/@media \(max-width:\s*640px\)\s*\{[\s\S]*?--selo-altura:\s*48px/);
  });

  it('texto não quebra em linhas (white-space: nowrap) e o selo não encolhe', () => {
    expect(corpoDoSeletor('.selo-home')).toMatch(/white-space:\s*nowrap/);
    expect(corpoDoSeletor('.selo-home')).toMatch(/flex:\s*none/);
  });
});

describe('SeloHome, cores da especificação', () => {
  it('fundo azul-marinho do token da barra e contorno dourado de 2px do friso', () => {
    const selo = corpoDoSeletor('.selo-home');
    expect(selo).toMatch(/background:\s*var\(--cor-sidebar-fundo/);
    expect(selo).toMatch(/border:\s*2px solid var\(--cor-friso/);
  });

  it('o título usa a fonte de título e o HOME usa a cor do friso', () => {
    expect(corpoDoSeletor('.selo-home__titulo')).toMatch(/font-family:\s*var\(--fonte-titulo\)/);
    expect(corpoDoSeletor('.selo-home__rotulo')).toMatch(/color:\s*var\(--cor-friso/);
    expect(corpoDoSeletor('.selo-home__rotulo')).toMatch(/letter-spacing:/);
  });

  it('tema escuro: não usa nenhum token que inverte com o tema (todas as cores são fixas da barra)', () => {
    expect(fonte).not.toMatch(
      /var\(--cor-(texto|fundo|primaria|acento|titulo-texto|foco|borda)(?![-\w])/
    );
  });
});

describe('SeloHome, foco, impressão e posição', () => {
  it('foco de teclado visível sobre a barra escura (mesmo anel da trilha)', () => {
    expect(corpoDoSeletor('.selo-home:focus-visible')).toMatch(
      /outline:\s*var\(--foco-espessura, 2px\) solid var\(--cor-sidebar-texto/
    );
  });

  it('não tem posição fixa nem absoluta: quem fixa é a barra do topo', () => {
    expect(fonte).not.toMatch(/position:\s*(fixed|absolute)/);
  });

  it('some na impressão', () => {
    expect(fonte).toMatch(/@media print\s*\{[\s\S]*\.selo-home\s*\{\s*display:\s*none/);
  });
});

describe('SeloHome, modo adaptado', () => {
  it('pílula preta com contorno e texto brancos (mesmo padrão do BotaoHome)', () => {
    expect(fonte).toMatch(
      /:root\[data-modo-adaptado='on'\]\s+\.selo-home\s*\{[^}]*background:\s*#000000/
    );
    expect(fonte).toMatch(
      /:root\[data-modo-adaptado='on'\]\s+\.selo-home\s*\{[^}]*border-color:\s*#ffffff/
    );
  });

  it('HOME e título ficam brancos no modo: o friso vira preto ali e sumiria sobre o preto', () => {
    expect(fonte).toMatch(
      /:root\[data-modo-adaptado='on'\]\s+\.selo-home__rotulo\s*\{[^}]*color:\s*#ffffff/
    );
    expect(fonte).toMatch(
      /:root\[data-modo-adaptado='on'\]\s+\.selo-home__titulo\s*\{[^}]*color:\s*#ffffff/
    );
  });

  it('título sem serifa no modo (base.css: o modo adaptado tira a serifa dos títulos)', () => {
    expect(fonte).toMatch(
      /:root\[data-modo-adaptado='on'\]\s+\.selo-home__titulo\s*\{[^}]*font-family:\s*var\(--fonte-texto\)/
    );
  });

  it('traço do templo branco no modo', () => {
    expect(fonte).toMatch(
      /:root\[data-modo-adaptado='on'\]\s+\.selo-home__traco\s*\{[^}]*stroke:\s*#ffffff/
    );
  });
});
