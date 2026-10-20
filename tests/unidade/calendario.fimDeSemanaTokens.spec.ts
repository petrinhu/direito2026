import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcularContraste } from '@/core/design/contraste';
import { extrairVariaveisHex, recortarBlocoDeSeletorTopoDeArquivo } from '@/core/design/tokens';

/**
 * Tokens do tom de fim de semana do calendário (tokens.css), medidos contra o
 * FUNDO REAL da célula (L-17): o número do dia usa --cor-texto (e --cor-texto-suave
 * nos dias de outro mês) sobre --cor-cal-fimdesemana-fundo. Lê tokens.css de
 * verdade; nunca copia os valores para cá.
 *
 * Nasce vermelho: os tokens --cor-cal-fimdesemana-* não existiam.
 */
const CAMINHO = resolve(__dirname, '../../src/ui/estilos/tokens.css');
const css = readFileSync(CAMINHO, 'utf-8');

const CLARO = extrairVariaveisHex(recortarBlocoDeSeletorTopoDeArquivo(css, ':root {') ?? '');
const ESCURO = extrairVariaveisHex(
  recortarBlocoDeSeletorTopoDeArquivo(css, ':root[data-theme="dark"]') ?? ''
);
const ADAPTADO = extrairVariaveisHex(
  recortarBlocoDeSeletorTopoDeArquivo(css, ':root[data-modo-adaptado="on"] {') ?? ''
);

/** Bloco do prefers-color-scheme escuro: vai do @media até o bloco data-theme. */
const TRECHO_MEDIA_ESCURO = css.slice(
  css.indexOf('@media (prefers-color-scheme: dark)'),
  css.indexOf(':root[data-theme="dark"]')
);

const PISO = 4.5;

describe('tom de fim de semana: declarado nos três temas', () => {
  it('o tema claro define fundo e texto do tom', () => {
    expect(CLARO['--cor-cal-fimdesemana-fundo']).toMatch(/^#[0-9a-f]{6}$/i);
    expect(CLARO['--cor-cal-fimdesemana-texto']).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('o escuro por escolha (data-theme="dark") define o mesmo par', () => {
    expect(ESCURO['--cor-cal-fimdesemana-fundo']).toMatch(/^#[0-9a-f]{6}$/i);
    expect(ESCURO['--cor-cal-fimdesemana-texto']).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('o escuro por preferência do sistema declara o mesmo tom do data-theme', () => {
    const fundo = TRECHO_MEDIA_ESCURO.match(/--cor-cal-fimdesemana-fundo:\s*(#[0-9a-f]{6})/i)?.[1];
    expect(fundo, 'sem declaração no @media escuro').toBeDefined();
    expect(fundo?.toLowerCase()).toBe(ESCURO['--cor-cal-fimdesemana-fundo']?.toLowerCase());
  });
});

describe('contraste do número do dia e do texto sobre o tom (WCAG AA, 4,5:1)', () => {
  it('tema claro: número do dia (--cor-texto) sobre o tom', () => {
    const cr = calcularContraste(
      CLARO['--cor-cal-fimdesemana-fundo'] ?? '',
      CLARO['--cor-texto'] ?? ''
    );
    expect(cr).toBeGreaterThanOrEqual(PISO);
  });

  it('tema claro: número de dia de outro mês (--cor-texto-suave) sobre o tom', () => {
    const cr = calcularContraste(
      CLARO['--cor-cal-fimdesemana-fundo'] ?? '',
      CLARO['--cor-texto-suave'] ?? ''
    );
    expect(cr).toBeGreaterThanOrEqual(PISO);
  });

  it('tema escuro: número do dia (--cor-texto) sobre o tom', () => {
    const cr = calcularContraste(
      ESCURO['--cor-cal-fimdesemana-fundo'] ?? '',
      ESCURO['--cor-texto'] ?? ''
    );
    expect(cr).toBeGreaterThanOrEqual(PISO);
  });

  it('tema escuro: número de dia de outro mês (--cor-texto-suave) sobre o tom', () => {
    const cr = calcularContraste(
      ESCURO['--cor-cal-fimdesemana-fundo'] ?? '',
      ESCURO['--cor-texto-suave'] ?? ''
    );
    expect(cr).toBeGreaterThanOrEqual(PISO);
  });

  it('chip da legenda: texto sobre o tom nos dois temas', () => {
    for (const tema of [CLARO, ESCURO]) {
      const cr = calcularContraste(
        tema['--cor-cal-fimdesemana-fundo'] ?? '',
        tema['--cor-cal-fimdesemana-texto'] ?? ''
      );
      expect(cr).toBeGreaterThanOrEqual(PISO);
    }
  });
});

describe('o tom não se confunde com cores já usadas no calendário (claro)', () => {
  it('é diferente do creme de prazo, do bege de semestre, do azul de hoje e do fundo do cartão', () => {
    const fundo = CLARO['--cor-cal-fimdesemana-fundo'];
    for (const outra of [
      '--cor-cal-prazo-fundo',
      '--cor-cal-semestre-fundo',
      '--cor-primaria-clara',
      '--cor-fundo-elevado'
    ]) {
      expect(fundo?.toLowerCase(), `igual a ${outra}`).not.toBe(CLARO[outra]?.toLowerCase());
    }
  });
});

describe('modo adaptado: sem tom colorido (sinal é o nome do dia no cabeçalho)', () => {
  it('o fundo fica branco e o texto preto, como o resto da grade no modo adaptado', () => {
    expect(ADAPTADO['--cor-cal-fimdesemana-fundo']).toBe('#ffffff');
    expect(ADAPTADO['--cor-cal-fimdesemana-texto']).toBe('#000000');
  });
});
