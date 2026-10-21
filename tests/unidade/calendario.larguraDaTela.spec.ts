import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Página do calendário não passa da largura da tela no modo leitura ampliada a
 * 320px (QA v1: scrollWidth 350 contra 320, e o título "Calendário" quebrava no
 * meio da palavra). Medido no navegador isolado: ocultar o contêiner .calendario
 * leva o scrollWidth a 320. Ele é display: grid sem colunas definidas, então a
 * trilha implícita cresce até o mínimo-conteúdo do filho mais largo (326px),
 * numa tela com 272px de conteúdo. O título, em 56px com o espaçamento de letra
 * do modo, tem 326px sozinho.
 *
 * Correção em dois pontos, com o mesmo padrão que Unidade.vue já usa no h1:
 * - .calendario com uma coluna que encolhe (minmax(0, 1fr));
 * - no modo adaptado o título cede ao espaço da tela (min com 12vw), para a
 *   palavra inteira caber. Fora do adaptado o título não muda.
 *
 * Nasce vermelho: nenhuma das duas regras existia.
 */
const CSS = readFileSync(
  resolve(__dirname, '../../src/ui/estilos/calendario.css'),
  'utf-8'
).replace(/\/\*[\s\S]*?\*\//g, '');

/** Corpo normalizado da regra (fora de @media) cujo seletor é exatamente o informado. */
function corpoDe(seletor: string): string {
  const achados = [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => (m[1] ?? '').replace(/\s+/g, ' ').trim() === seletor)
    .map((m) => (m[2] ?? '').replace(/\s+/g, ' '));
  expect(achados.length, `sem regra para ${seletor}`).toBeGreaterThan(0);
  return achados.join(' ');
}

describe('página do calendário: colunas que encolhem, sem passar da tela', () => {
  it('o contêiner da página tem uma coluna que encolhe (minmax(0, 1fr)), não a trilha automática', () => {
    expect(corpoDe('.calendario')).toContain('grid-template-columns: minmax(0, 1fr)');
  });

  it('os filhos diretos da página podem encolher abaixo do conteúdo (min-width: 0)', () => {
    expect(corpoDe('.calendario > *')).toContain('min-width: 0');
  });

  it('o bloco da grade, legenda e lista tem coluna que encolhe e filhos com min-width: 0', () => {
    const vue = readFileSync(
      resolve(__dirname, '../../src/ui/componentes/CalendarioCompleto.vue'),
      'utf-8'
    );
    const estilo = vue.slice(vue.indexOf('<style'), vue.indexOf('</style>'));
    expect(estilo).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(estilo).toMatch(/\.calendario-completo > \*\s*\{[^}]*min-width: 0/);
  });

  it('o painel do dia quebra palavra longa até no tamanho mínimo (anywhere) e a lista tem coluna que encolhe', () => {
    const vue = readFileSync(
      resolve(__dirname, '../../src/ui/componentes/PainelDoDia.vue'),
      'utf-8'
    );
    const estilo = vue.slice(vue.indexOf('<style'), vue.indexOf('</style>'));
    expect(estilo).toMatch(/\.painel-do-dia\s*\{[^}]*overflow-wrap: anywhere/);
    expect(estilo).toMatch(
      /\.painel-do-dia__lista\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/
    );
    expect(estilo).toMatch(/\.painel-do-dia__item\s*\{[^}]*min-width: 0/);
  });

  it('a grade mensal rola dentro do próprio quadro quando os sete dias não cabem (não empurra a página)', () => {
    expect(corpoDe('.grade-calendario')).toContain('overflow-x: auto');
  });
});

describe('título do calendário na leitura ampliada cede ao tamanho da tela', () => {
  it('no modo adaptado o título usa o menor entre o token de título e 12vw', () => {
    expect(corpoDe(":root[data-modo-adaptado='on'] .calendario__titulo")).toContain(
      'font-size: min(var(--escala-xl), 12vw)'
    );
  });
});
