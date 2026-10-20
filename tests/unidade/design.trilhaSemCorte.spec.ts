import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Ordem do líder (cabeçalho em celular, 390px): o nome da página atual
 * aparece INTEIRO, quebrando em até 2 linhas se precisar, sem reticências.
 * Medido antes da correção (Playwright, headless, 390px e 1280px): "Petição
 * comentada" tinha scrollWidth 160 numa caixa de 129; "Sociologia Jurídica",
 * 158 em 129; "Português e Redação Jurídica 1", 253 em 144 (1280px). Causa:
 * `text-overflow: ellipsis` + `white-space: nowrap` + teto `max-width` de
 * 9rem/10rem nos itens da trilha.
 *
 * Mesmo padrão de tests/unidade/design.gavetaSemMovimento.spec.ts: trava a
 * regra CSS no arquivo-fonte (comentários removidos), porque jsdom não avalia
 * media/container query. Nasce vermelho antes da correção.
 */
const CAMINHO = resolve(__dirname, '../../src/ui/componentes/TrilhaNavegacao.vue');

function fonteSemComentarios(): string {
  return readFileSync(CAMINHO, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('trilha de navegação: nenhum nível é cortado', () => {
  const fonte = fonteSemComentarios();

  it('não usa reticências de corte (text-overflow: ellipsis) em nenhum nível', () => {
    expect(fonte).not.toMatch(/text-overflow:\s*ellipsis/);
  });

  it('não força uma linha só (white-space: nowrap) em nenhum nível', () => {
    expect(fonte).not.toMatch(/white-space:\s*nowrap/);
  });

  it('não limita a largura dos níveis com teto em rem que corta o nome', () => {
    expect(fonte).not.toMatch(/max-width:\s*(9|10)rem/);
    expect(fonte).not.toMatch(/max-width:\s*min\(100%,\s*10rem\)/);
  });

  it('a página atual (classe no li) ocupa o espaço que sobra, sem teto de largura', () => {
    expect(fonte).toMatch(/\.trilha-navegacao__atual\s*\{[^}]*flex:\s*1\s+1\s+auto/);
  });

  it('em tela estreita esconde só os níveis além dos dois últimos, não o penúltimo', () => {
    const faixaEstreita =
      fonte.split('@container (max-width: 20.99rem)')[1]?.split('@container')[0] ?? '';
    expect(faixaEstreita, 'faixa estreita não encontrada').not.toBe('');
    expect(faixaEstreita).toMatch(/nth-last-child\(\s*n\s*\+\s*3\s*\)\s*\{[^}]*display:\s*none/);
    expect(faixaEstreita).not.toMatch(/li:not\(:last-child\)\s*\{[^}]*display:\s*none/);
  });
});
