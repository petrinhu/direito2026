// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Cabeçalho com o selo no celular (achado da QA, 28/09/2026 em 390 e 360px):
 * com a trilha dividindo a linha com a busca, a barra ia de 159px para 215px
 * em 3 linhas e a trilha "Unidade 3 / Resumo" quebrava ao lado da busca. A
 * regra: a trilha ocupa a linha inteira no celular (fica sozinha, legível), e
 * o selo continua no início da primeira linha, sem reordenar nada no DOM (a
 * ordem de Tab segue a ordem visual, WCAG 2.4.3).
 *
 * jsdom não aplica a cascata do CSS, então a regra é travada no arquivo-fonte,
 * sem os comentários.
 */
const fonte = readFileSync(resolve(__dirname, '../../src/ui/layout/BarraTopo.vue'), 'utf-8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/<!--[\s\S]*?-->/g, '');

describe('BarraTopo no celular, layout do selo', () => {
  it('até 640px, a trilha ocupa a linha inteira (flex-basis: 100%)', () => {
    expect(fonte).toMatch(
      /@media \(max-width:\s*640px\)\s*\{[^@]*?\.barra-topo__trilha\s*\{[^}]*flex-basis:\s*100%/
    );
  });

  it('a linha inteira da trilha vale só fora do modo adaptado (dentro dele empurra o Tema para baixo do quadro)', () => {
    expect(fonte).toMatch(
      /@media \(max-width:\s*640px\)\s*\{[^@]*?:root:not\(\[data-modo-adaptado='on'\]\) \.barra-topo__trilha\s*\{[^}]*flex-basis:\s*100%/
    );
  });

  it('a trilha no celular não divide mais a linha com a busca (sem flex-basis de 14rem)', () => {
    expect(fonte).not.toMatch(/\.barra-topo__trilha\s*\{[^}]*flex-basis:\s*14rem/);
  });

  it('o selo continua como primeiro item do markup (ordem de Tab igual à visual)', () => {
    expect(fonte.indexOf('<SeloHome')).toBeLessThan(fonte.indexOf('barra-topo__botao-gaveta'));
    expect(fonte).not.toMatch(/\border:\s*-?\d/);
  });
});
