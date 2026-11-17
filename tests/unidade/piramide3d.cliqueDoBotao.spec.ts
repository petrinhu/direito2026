import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Clique no fim do voo (QA de 17/11): "Testar som" tem de continuar clicável com o canvas em tela cheia.
 * O canvas do voo (.pir-tela--voo, z-index 1000, position fixed) não pode receber o ponteiro: o
 * tratamento de toque é por ouvintes no documento. Prova de CSS, lida do arquivo de estilo real.
 */
const CSS = readFileSync(resolve(__dirname, '../../src/ui/piramide3d/estilo.css'), 'utf-8');

function bloco(seletor: string): string {
  const i = CSS.indexOf(`${seletor} {`);
  if (i < 0) throw new Error(`bloco ausente: ${seletor}`);
  return CSS.slice(i, CSS.indexOf('}', i) + 1);
}

describe('clique no fim do voo', () => {
  it('o canvas da cena não intercepta o ponteiro (pointer-events: none)', () => {
    expect(bloco('.pir-tela')).toMatch(/pointer-events:\s*none/);
  });

  it('o canvas em voo (tela cheia) continua sem interceptar o ponteiro', () => {
    expect(bloco('.pir-tela--voo')).not.toMatch(/pointer-events:\s*auto/);
  });

  it('os controles de som ficam fora da tela do voo: não há z-index que os cubra', () => {
    expect(CSS).not.toMatch(/\.figura-piramide3d__controles\s*\{[^}]*z-index/);
  });
});
