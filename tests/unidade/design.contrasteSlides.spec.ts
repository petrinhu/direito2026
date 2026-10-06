import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';
import { extrairVariaveisHex, recortarBlocoDeSeletorTopoDeArquivo } from '@/core/design/tokens';

/**
 * Contraste dos tokens do slide (paleta própria, ver slide-tokens.css): todo
 * texto >= 4,5:1 contra os três fundos reais do slide (base, ponta do
 * gradiente e cartão). L-42: contra o fundo onde o texto de fato está.
 */
const CAMINHO = resolve(__dirname, '../../src/ui/area-restrita/slide-tokens.css');
const css = readFileSync(CAMINHO, 'utf-8');
const recorte = recortarBlocoDeSeletorTopoDeArquivo(css, '.ar-slide');
if (!recorte) throw new Error('bloco .ar-slide ausente');
const t = extrairVariaveisHex(recorte);

const FUNDOS = ['--s-fundo', '--s-fundo-2', '--s-cartao'] as const;
const TEXTOS = [
  '--s-texto',
  '--s-texto-suave',
  '--s-ouro',
  '--s-ciano',
  '--s-turquesa',
  '--s-violeta',
  '--s-magenta',
  '--s-menta',
  '--s-coral',
  '--s-ambar'
] as const;

describe('paleta do slide', () => {
  for (const texto of TEXTOS) {
    for (const fundo of FUNDOS) {
      it(`${texto} sobre ${fundo} >= 4,5:1`, () => {
        expect(t[texto], `${texto} ausente`).toBeDefined();
        expect(t[fundo], `${fundo} ausente`).toBeDefined();
        expect(calcularContraste(t[texto]!, t[fundo]!)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('o texto do encerramento (creme) passa de 4,5:1 sobre o cartão verde escuro', () => {
    // Cartão do encerramento: rgb(16 40 31 / 0.55) sobre #0d1118, medido como o pior caso (opaco).
    expect(calcularContraste(t['--s-texto']!, '#10281f')).toBeGreaterThanOrEqual(4.5);
  });
});
