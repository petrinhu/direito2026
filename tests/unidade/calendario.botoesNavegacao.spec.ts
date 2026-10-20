import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';
import { extrairVariaveisHex, recortarBlocoDeSeletorTopoDeArquivo } from '@/core/design/tokens';

/**
 * Barra de navegação do calendário (ordem do líder, 20/10/2026): botões no
 * padrão do site (azul-marinho da lateral, texto claro, friso dourado), linha
 * única a partir de 640px, e título centralizado de verdade. Lê os arquivos
 * de verdade (CSS sem comentários e tokens.css); o FullCalendar injeta o
 * próprio CSS em runtime, então a regra é travada na fonte.
 *
 * Nasce vermelho: os botões ainda usavam o azul-primário e o contorno padrão
 * do FullCalendar, sem a grade de áreas nem os pares de token.
 */
const CSS = readFileSync(
  resolve(__dirname, '../../src/ui/estilos/calendario.css'),
  'utf-8'
).replace(/\/\*[\s\S]*?\*\//g, '');
const TOKENS = readFileSync(resolve(__dirname, '../../src/ui/estilos/tokens.css'), 'utf-8');

function regras(): Array<{ seletor: string; corpo: string }> {
  const achados: Array<{ seletor: string; corpo: string }> = [];
  for (const m of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    achados.push({ seletor: (m[1] ?? '').replace(/\s+/g, ' ').trim(), corpo: m[2] ?? '' });
  }
  return achados;
}

/** Corpo normalizado da regra cujo seletor é exatamente o informado. */
function corpoDe(seletor: string): string {
  const achados = regras().filter((r) => r.seletor === seletor);
  expect(achados.length, `sem regra para ${seletor}`).toBeGreaterThan(0);
  return achados.map((r) => r.corpo.replace(/\s+/g, ' ')).join(' ');
}

describe('barra: linha única a partir de 640px, título centralizado no meio', () => {
  it('no celular o título fica em cima e os botões embaixo, em áreas nomeadas', () => {
    const corpo = corpoDe('.grade-calendario .fc-header-toolbar');
    expect(corpo).toContain('display: grid');
    expect(corpo).toContain("grid-template-areas: 'titulo titulo' 'esq dir'");
  });

  it('a partir de 640px a barra vira uma linha: esquerda, título no meio, direita', () => {
    const depois = CSS.slice(CSS.indexOf('@media (min-width: 40rem)'));
    expect(depois).toContain("grid-template-areas: 'esq titulo dir'");
    expect(depois).toContain('.grade-calendario .fc-header-toolbar');
  });

  it('cada bloco da barra (esquerda, título, direita) ocupa a sua área', () => {
    const texto = CSS.replace(/\s+/g, ' ');
    expect(texto).toContain('> :nth-child(1) { grid-area: esq');
    expect(texto).toContain('> :nth-child(2) { grid-area: titulo');
    expect(texto).toContain('> :nth-child(3) { grid-area: dir');
  });
});

describe('botões: cores do site, por token', () => {
  it('o botão repousa em azul-marinho da lateral, com texto claro e contorno dourado do friso', () => {
    const corpo = corpoDe('.grade-calendario .fc-button');
    expect(corpo).toContain('background-color: var(--cor-sidebar-fundo)');
    expect(corpo).toContain('color: var(--cor-sidebar-texto)');
    expect(corpo).toContain('border: 1px solid var(--cor-friso)');
    expect(corpo).toContain('border-radius: var(--raio-md)');
  });

  it('as variáveis --fc-button-* do FullCalendar usam os mesmos tokens do site', () => {
    const bloco = CSS.slice(
      CSS.indexOf('.grade-calendario .fc {'),
      CSS.indexOf('.grade-calendario .fc-toolbar-title')
    );
    expect(bloco).toContain('--fc-button-bg-color: var(--cor-sidebar-fundo');
    expect(bloco).toContain('--fc-button-text-color: var(--cor-sidebar-texto');
    expect(bloco).not.toMatch(/--fc-button-[\w-]+:\s*var\(--cor-primaria[,)]/);
  });

  it('ao passar o ponteiro o fundo vai para o azul do item ativo da lateral, com sublinhado', () => {
    const corpo = corpoDe('.grade-calendario .fc-button:not(:disabled):hover');
    expect(corpo).toContain('background-color: var(--cor-sidebar-item-ativo-fundo)');
    expect(corpo).toContain('text-decoration: underline');
  });

  it('o foco usa o anel do site (--cor-foco, espessura e deslocamento), sem a sombra cinza do FullCalendar', () => {
    const anel = corpoDe('.grade-calendario .fc-button:focus-visible');
    expect(anel).toContain('outline: var(--foco-espessura, 2px) solid var(--cor-foco');
    expect(anel).toContain('outline-offset: var(--foco-deslocamento, 2px)');
    expect(corpoDe('.grade-calendario .fc-button:focus')).toContain('box-shadow: none');
  });

  it('HOJE desabilitado mostra fundo sutil, texto suave e contorno tracejado, sem opacidade', () => {
    const corpo = corpoDe('.grade-calendario .fc-button:disabled');
    expect(corpo).toContain('opacity: 1');
    expect(corpo).toContain('background-color: var(--cor-fundo-sutil)');
    expect(corpo).toContain('color: var(--cor-texto-suave)');
    expect(corpo).toContain('border-style: dashed');
  });

  it('no modo adaptado o contorno dos botões vai para 2px, o friso preto', () => {
    const adaptado = CSS.slice(
      CSS.indexOf(":root[data-modo-adaptado='on'] .grade-calendario .fc-button {")
    );
    expect(adaptado).toContain('border: 2px solid var(--cor-friso)');
  });
});

/** Valores hex de um bloco de tokens (claro, escuro ou modo adaptado). */
const TEMAS = {
  claro: extrairVariaveisHex(recortarBlocoDeSeletorTopoDeArquivo(TOKENS, ':root {') ?? ''),
  escuro: extrairVariaveisHex(
    recortarBlocoDeSeletorTopoDeArquivo(TOKENS, ':root[data-theme="dark"]') ?? ''
  ),
  adaptado: extrairVariaveisHex(
    recortarBlocoDeSeletorTopoDeArquivo(TOKENS, ':root[data-modo-adaptado="on"] {') ?? ''
  )
};

describe('contraste do texto dos botões, medido sobre o fundo real (WCAG AA, 4,5:1)', () => {
  const pares: Array<{ nome: string; texto: string; fundo: string }> = [
    { nome: 'botão em repouso', texto: '--cor-sidebar-texto', fundo: '--cor-sidebar-fundo' },
    {
      nome: 'botão com ponteiro',
      texto: '--cor-sidebar-texto',
      fundo: '--cor-sidebar-item-ativo-fundo'
    },
    { nome: 'botão desabilitado', texto: '--cor-texto-suave', fundo: '--cor-fundo-sutil' }
  ];

  for (const tema of ['claro', 'escuro', 'adaptado'] as const) {
    for (const par of pares) {
      it(`${tema}: ${par.nome} passa de 4,5:1`, () => {
        const v = TEMAS[tema];
        const cr = calcularContraste(v[par.fundo] ?? '', v[par.texto] ?? '');
        expect(Number.isNaN(cr), `token ausente em ${tema}`).toBe(false);
        expect(cr).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
