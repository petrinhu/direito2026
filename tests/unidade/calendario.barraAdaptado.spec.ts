import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Barra de navegação no modo leitura ampliada (QA final, 20/10/2026: em 1280
 * "< ANTERIOR" e HOJE quebravam em duas linhas, com o bloco da esquerda em
 * 284px). Contas com as larguras medidas pelo QA no próprio navegador:
 * - botão "< ANTERIOR" 173,5px; HOJE 93px (em 24px, com contorno de 2px e
 *   padding de 12px); título "outubro de 2026" 368,1px (39px, escala-lg);
 * - a margem entre ANTERIOR e HOJE cai de 18px (FullCalendar) para 8px, e o
 *   espaço entre colunas da grade é 8px.
 * Com lateral de 280px e margem de 24px dos dois lados, a linha única cabe a
 * partir de 1262px de viewport (2 x 274,5 + 368,1 + 16 = 933,1px de conteúdo).
 * Abaixo disso, o título fica em cima e os botões embaixo, como no celular.
 *
 * Nasce vermelho: a grade do modo adaptado não tinha a regra de linha única
 * a partir de 1262px nem a margem de 8px entre os dois botões da esquerda.
 */
const CSS = readFileSync(
  resolve(__dirname, '../../src/ui/estilos/calendario.css'),
  'utf-8'
).replace(/\/\*[\s\S]*?\*\//g, '');

/** Conteúdo (normalizado) de um bloco @media cuja condição é exatamente a informada. */
function blocoMedia(condicao: string): string {
  const inicio = CSS.indexOf(`@media ${condicao} {`);
  expect(inicio, `sem @media ${condicao}`).toBeGreaterThan(-1);
  const resto = CSS.slice(inicio + `@media ${condicao} {`.length);
  const fim = resto.search(/\n\}\n/);
  return resto.slice(0, fim).replace(/\s+/g, ' ');
}

describe('modo adaptado: linha única só a partir de 1262px de viewport', () => {
  it('entre 640px e 1261px o título fica em cima e os botões embaixo (sem linha única)', () => {
    const bloco = blocoMedia('(min-width: 40rem) and (max-width: 1261px)');
    expect(bloco).toContain(":root[data-modo-adaptado='on'] .grade-calendario .fc-header-toolbar");
    expect(bloco).toContain("grid-template-areas: 'titulo titulo' 'esq dir'");
  });

  it('a partir de 1262px a barra é uma linha, com o título no meio das duas colunas', () => {
    const bloco = blocoMedia('(min-width: 1262px)');
    expect(bloco).toContain(":root[data-modo-adaptado='on'] .grade-calendario .fc-header-toolbar");
    expect(bloco).toContain('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr)');
    expect(bloco).toContain("grid-template-areas: 'esq titulo dir'");
  });

  it('a partir de 1262px o grupo da esquerda usa 8px entre ANTERIOR e HOJE (sem a margem de 18px) e nenhum espaço extra do bloco', () => {
    const bloco = blocoMedia('(min-width: 1262px)');
    expect(bloco).toContain(
      ":root[data-modo-adaptado='on'] .grade-calendario .fc-toolbar-chunk > :not(:first-child) { margin-left: var(--esp-2, 0.5rem)"
    );
    expect(bloco).toContain(
      ":root[data-modo-adaptado='on'] .grade-calendario .fc-toolbar-chunk { gap: 0"
    );
  });

  it('a regra de linha única não pega o celular (abaixo de 340px segue a coluna da regra estreita)', () => {
    const bloco = blocoMedia('(min-width: 40rem) and (max-width: 1261px)');
    expect(bloco).not.toContain('max-width: 339px');
  });

  it('o modo adaptado não reduz a fonte dos botões nem do título nessa regra', () => {
    expect(blocoMedia('(min-width: 1262px)')).not.toContain('font-size');
    expect(blocoMedia('(min-width: 40rem) and (max-width: 1261px)')).not.toContain('font-size');
  });
});
