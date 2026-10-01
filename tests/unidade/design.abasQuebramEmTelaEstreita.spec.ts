import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Cinco abas (Resumo, Mapa mental, Fichamento, Mnemônicos, Quiz) não cabem
 * numa linha só em 320px nem em 360px. A lista de abas quebra de linha em
 * QUALQUER modo, e não só no adaptado, para nenhuma aba sair da tela. A
 * medida real é o e2e tests/e2e/abas-novas-largura.spec.ts; este teste só
 * impede que a regra suma da folha.
 */
function regraBase(css: string, seletor: string): string {
  const inicio = css.indexOf(`${seletor} {`);
  expect(inicio, `regra ${seletor} ausente`).toBeGreaterThanOrEqual(0);
  return css.slice(inicio, css.indexOf('}', inicio));
}

describe('AbasUnidade em tela estreita', () => {
  const fonte = readFileSync(
    resolve(__dirname, '../../src/ui/componentes/AbasUnidade.vue'),
    'utf-8'
  );

  it('a lista de abas quebra de linha também fora do modo adaptado', () => {
    expect(regraBase(fonte, '.abas-unidade__lista')).toMatch(/flex-wrap:\s*wrap/);
  });
});

describe('texto do mapa mental usa a escala de corpo', () => {
  const fonte = readFileSync(
    resolve(__dirname, '../../src/ui/componentes/NoMapaMental.vue'),
    'utf-8'
  );

  it('o detalhe do nó segue --escala-base (24px no modo adaptado), nunca a escala pequena', () => {
    const regra = regraBase(fonte, '.no-mapa__detalhe');
    expect(regra).toContain('var(--escala-base');
    expect(regra).not.toContain('--escala-sm');
  });
});
