// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BotaoHome from '@/ui/componentes/BotaoHome.vue';

/**
 * Botão "Home" flutuante (ordem do líder, 20/10/2026): círculo azul-marinho
 * com o templo em traço dourado e o rótulo "Home" abaixo. O comportamento
 * (aparece fora da home, some na home) é do LayoutBase; aqui fica o que o
 * próprio componente garante: link, nome acessível, desenho decorativo e
 * as regras de CSS que a especificação exige (alvo, foco, impressão,
 * modo adaptado, tema escuro, sem posição fixa própria).
 */
const fonte = readFileSync(resolve(__dirname, '../../src/ui/componentes/BotaoHome.vue'), 'utf-8');

describe('BotaoHome, marcação', () => {
  it('é um link para a raiz do site', () => {
    const w = mount(BotaoHome);
    expect(w.find('a').attributes('href')).toBe('/');
  });

  it('tem nome acessível "Home, página inicial"', () => {
    const w = mount(BotaoHome);
    expect(w.find('a').attributes('aria-label')).toBe('Home, página inicial');
  });

  it('mostra o rótulo "Home" visível, abaixo do círculo', () => {
    const w = mount(BotaoHome);
    expect(w.find('.botao-home__rotulo').text()).toBe('Home');
  });

  it('o desenho do templo é decorativo (aria-hidden e fora do foco)', () => {
    const w = mount(BotaoHome);
    const svg = w.find('svg');
    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.attributes('focusable')).toBe('false');
  });
});

describe('BotaoHome, regras de estilo da especificação', () => {
  it('alvo de toque de pelo menos 44px', () => {
    expect(fonte).toMatch(/\.botao-home\s*\{[^}]*min-height:\s*44px/);
  });

  it('foco de teclado visível (anel próprio em :focus-visible)', () => {
    expect(fonte).toMatch(/\.botao-home:focus-visible\s*\{[^}]*outline:/);
  });

  it('não tem posição fixa nem absoluta: a fixação é da pilha sticky do LayoutBase', () => {
    expect(fonte).not.toMatch(/position:\s*(fixed|absolute)/);
  });

  it('some na impressão', () => {
    expect(fonte).toMatch(/@media print\s*\{[\s\S]*\.botao-home\s*\{\s*display:\s*none/);
  });

  it('modo adaptado: círculo preto com traço branco', () => {
    expect(fonte).toMatch(
      /:root\[data-modo-adaptado='on'\]\s+\.botao-home__circulo\s*\{[^}]*background:\s*#000/
    );
    expect(fonte).toMatch(/:root\[data-modo-adaptado='on'\][^{]*\.botao-home__traco\s*\{[^}]*#fff/);
  });

  it('modo adaptado: rótulo com 24px', () => {
    expect(fonte).toMatch(
      /:root\[data-modo-adaptado='on'\]\s+\.botao-home__rotulo\s*\{[^}]*font-size:\s*1\.5rem/
    );
  });

  it('tema escuro (escolha manual): borda dourada para separar do fundo escuro', () => {
    expect(fonte).toMatch(
      /:root\[data-theme=['"]dark['"]\]\s+\.botao-home__circulo\s*\{[^}]*border[^;]*var\(--cor-friso/
    );
  });

  it('tema escuro (preferência do sistema): mesma borda dourada', () => {
    expect(fonte).toMatch(
      /prefers-color-scheme:\s*dark[\s\S]*\.botao-home__circulo\s*\{[^}]*border/
    );
  });
});
