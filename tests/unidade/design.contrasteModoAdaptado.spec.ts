import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';
import { extrairVariaveisHex, recortarBlocoDeSeletorTopoDeArquivo } from '@/core/design/tokens';

/**
 * Portão de contraste do modo de leitura adaptada (docs/modo-adaptado.md,
 * seção 3 e critério 1 da seção 8): todos os pares medem no mínimo 7:1
 * (WCAG 1.4.6, Contraste Aprimorado/AAA), com o par principal (texto sobre
 * fundo) medindo no mínimo 20:1. Mesmo mecanismo do portão de
 * design.contrasteTokens.spec.ts, lendo tokens.css de verdade, nunca
 * duplicando valor à mão aqui.
 */
const CAMINHO_TOKENS = resolve(__dirname, '../../src/ui/estilos/tokens.css');
const PISO_CONTRASTE_AAA = 7;
const PISO_CONTRASTE_PAR_PRINCIPAL = 20;

function carregarBlocoModoAdaptado(): Record<string, string> {
  const cssTexto = readFileSync(CAMINHO_TOKENS, 'utf-8');
  const bloco = recortarBlocoDeSeletorTopoDeArquivo(cssTexto, ':root[data-modo-adaptado="on"]');
  if (!bloco) {
    throw new Error('não achei o bloco :root[data-modo-adaptado="on"] em ' + CAMINHO_TOKENS);
  }
  return extrairVariaveisHex(bloco);
}

const PARES: ReadonlyArray<{ nome: string; texto: string; fundo: string; piso: number }> = [
  {
    nome: 'texto principal sobre fundo da página',
    texto: '--cor-texto',
    fundo: '--cor-fundo',
    piso: PISO_CONTRASTE_PAR_PRINCIPAL
  },
  {
    nome: 'link não visitado sobre fundo da página',
    texto: '--cor-primaria',
    fundo: '--cor-fundo',
    piso: PISO_CONTRASTE_AAA
  },
  {
    nome: 'link visitado sobre fundo da página',
    texto: '--cor-bordo',
    fundo: '--cor-fundo',
    piso: PISO_CONTRASTE_AAA
  },
  {
    nome: 'texto sobre a lateral',
    texto: '--cor-sidebar-texto',
    fundo: '--cor-sidebar-fundo',
    piso: PISO_CONTRASTE_AAA
  }
];

describe('contraste dos tokens do modo de leitura adaptada', () => {
  const tokens = carregarBlocoModoAdaptado();

  it.each(PARES)('$nome, no mínimo $piso:1', ({ texto, fundo, piso }) => {
    const corTexto = tokens[texto];
    const corFundo = tokens[fundo];
    expect(corTexto, `variável ${texto} ausente no bloco do modo adaptado`).toBeDefined();
    expect(corFundo, `variável ${fundo} ausente no bloco do modo adaptado`).toBeDefined();
    const contraste = calcularContraste(corTexto as string, corFundo as string);
    expect(contraste, `${texto} (${corTexto}) sobre ${fundo} (${corFundo})`).toBeGreaterThanOrEqual(
      piso
    );
  });
});
