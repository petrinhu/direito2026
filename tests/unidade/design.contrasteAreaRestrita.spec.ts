import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';
import { extrairVariaveisHex, recortarBlocoDeSeletorTopoDeArquivo } from '@/core/design/tokens';

/**
 * Portão de contraste da identidade visual do grupo (área restrita). Lê o
 * CSS de verdade, nunca duplica valor à mão. Texto >= 4,5:1 contra o fundo
 * REAL onde ele é usado (L-42), componentes de interface e linhas >= 3:1;
 * no modo adaptado, preto sobre branco (21:1).
 */
const CAMINHO =
  process.env.IDENTIDADE_CSS_PATH ??
  resolve(__dirname, '../../src/ui/area-restrita/identidade-tokens.css');
const SELETOR_NORMAL = ":root:not([data-modo-adaptado='on']) .area-restrita";
const SELETOR_ADAPTADO = ":root[data-modo-adaptado='on'] .area-restrita";

function bloco(seletor: string): Record<string, string> {
  const css = readFileSync(CAMINHO, 'utf-8');
  const recorte = recortarBlocoDeSeletorTopoDeArquivo(css, seletor);
  if (!recorte) throw new Error(`bloco ausente: ${seletor}`);
  return extrairVariaveisHex(recorte);
}

const FUNDOS = ['--cor-fundo', '--cor-fundo-elevado', '--cor-fundo-sutil'] as const;

const TEXTOS_SOBRE_TODOS_OS_FUNDOS = [
  '--cor-texto',
  '--cor-texto-suave',
  '--cor-primaria',
  '--cor-acento',
  '--ar-ouro',
  '--ar-ciano',
  '--ar-turquesa',
  '--ar-violeta',
  '--ar-magenta',
  '--ar-menta',
  '--ar-coral',
  '--ar-ambar'
] as const;

describe('identidade visual da área restrita: modo normal', () => {
  const t = bloco(SELETOR_NORMAL);

  for (const texto of TEXTOS_SOBRE_TODOS_OS_FUNDOS) {
    for (const fundo of FUNDOS) {
      it(`${texto} sobre ${fundo} >= 4,5:1`, () => {
        expect(t[texto], `${texto} ausente`).toBeDefined();
        expect(calcularContraste(t[texto]!, t[fundo]!)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  const pares: ReadonlyArray<[string, string, string, number]> = [
    ['título sobre fundo', '--cor-titulo-texto', '--cor-fundo', 4.5],
    ['sucesso', '--cor-sucesso-texto', '--cor-sucesso-bg', 4.5],
    ['erro', '--cor-erro-texto', '--cor-erro-bg', 4.5],
    ['mapa, era', '--cor-mapa-era-texto', '--cor-mapa-era-fundo', 4.5],
    ['mapa, fase', '--cor-mapa-fase-texto', '--cor-mapa-fase-fundo', 4.5],
    ['badge de acento', '--cor-acento', '--cor-acento-claro', 4.5],
    ['botão primário', '--ar-botao-texto', '--ar-botao-fundo', 4.5],
    ['foco sobre o fundo', '--cor-foco', '--cor-fundo', 3],
    ['foco sobre o cartão', '--cor-foco', '--cor-fundo-elevado', 3],
    ['borda forte sobre o fundo', '--cor-borda-forte', '--cor-fundo', 3],
    ['borda forte sobre o cartão', '--cor-borda-forte', '--cor-fundo-elevado', 3],
    ['linha do mapa sobre o fundo', '--cor-mapa-linha', '--cor-fundo', 3],
    ['campo de formulário: texto', '--cor-texto', '--ar-campo-fundo', 4.5],
    ['campo de formulário: borda', '--ar-campo-borda', '--ar-campo-fundo', 3],
    ['aviso (âmbar) sobre o aviso', '--ar-aviso-texto', '--ar-aviso-fundo', 4.5]
  ];
  for (const [nome, texto, fundo, piso] of pares) {
    it(`${nome} >= ${piso}:1`, () => {
      expect(t[texto], `${texto} ausente`).toBeDefined();
      expect(t[fundo], `${fundo} ausente`).toBeDefined();
      expect(calcularContraste(t[texto]!, t[fundo]!)).toBeGreaterThanOrEqual(piso);
    });
  }

  for (let n = 1; n <= 6; n += 1) {
    it(`linha do ramo ${n} do mapa >= 3:1 sobre o fundo`, () => {
      const cor = t[`--cor-mapa-ramo-${n}-fundo`];
      expect(cor, `ramo ${n} ausente`).toBeDefined();
      expect(calcularContraste(cor!, t['--cor-fundo']!)).toBeGreaterThanOrEqual(3);
    });
  }
});

describe('identidade visual da área restrita: modo adaptado', () => {
  const t = bloco(SELETOR_ADAPTADO);
  it('fundos brancos e textos pretos, 21:1', () => {
    for (const fundo of FUNDOS) expect(t[fundo]).toBe('#ffffff');
    for (const texto of TEXTOS_SOBRE_TODOS_OS_FUNDOS) {
      expect(t[texto], `${texto} ausente`).toBe('#000000');
    }
    expect(calcularContraste(t['--cor-texto']!, t['--cor-fundo']!)).toBe(21);
  });
});
