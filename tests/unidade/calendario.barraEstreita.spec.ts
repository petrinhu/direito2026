import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Barra de navegação em telas muito estreitas (pedido do orquestrador,
 * 20/10/2026). Em 320px o grupo "< ANTERIOR  HOJE" e "PRÓXIMO >" somados
 * (283px, medidos com as fontes do projeto) não cabem na linha de baixo, com
 * 24px de margem de cada lado (272px de conteúdo). Abaixo de 340px cada grupo
 * vira uma linha própria e o bloco quebra, sem cortar nem vazar texto, e a
 * fonte dos botões não desce abaixo de 13px (--escala-xs).
 *
 * Nasce vermelho: a barra só tinha as áreas "titulo titulo" / "esq dir", sem
 * regra para telas abaixo de 340px.
 */
const CSS = readFileSync(
  resolve(__dirname, '../../src/ui/estilos/calendario.css'),
  'utf-8'
).replace(/\/\*[\s\S]*?\*\//g, '');

/** Conteúdo do bloco @media (max-width: 339px), do abre-chave ao fecha no nível de fora. */
function blocoEstreito(): string {
  const m = CSS.match(/@media \(max-width: 339px\) \{([\s\S]*?)\n\}\n/);
  expect(m, 'sem @media (max-width: 339px) na barra').not.toBeNull();
  return (m?.[1] ?? '').replace(/\s+/g, ' ');
}

describe('barra abaixo de 340px: os dois grupos quebram de linha', () => {
  it('a barra vira uma coluna: título, grupo da esquerda, grupo da direita', () => {
    const bloco = blocoEstreito();
    expect(bloco).toContain('.grade-calendario .fc-header-toolbar');
    expect(bloco).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(bloco).toContain("grid-template-areas: 'titulo' 'esq' 'dir'");
  });

  it('o bloco da barra pode quebrar os botões de dentro (flex-wrap), sem vazar a caixa', () => {
    const bloco = blocoEstreito();
    expect(bloco).toContain('.grade-calendario .fc-toolbar-chunk');
    expect(bloco).toContain('flex-wrap: wrap');
  });

  it('a regra estreita não reduz a fonte dos botões abaixo de 13px', () => {
    const bloco = blocoEstreito();
    expect(bloco).not.toContain('font-size');
    const base = CSS.match(/\.grade-calendario \.fc-button \{([^}]*)\}/);
    expect(base?.[1]).toContain('font-size: var(--escala-xs');
  });
});
