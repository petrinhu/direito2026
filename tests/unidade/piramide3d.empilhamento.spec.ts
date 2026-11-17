import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Empilhamento do voo (QA rodada 5, 17/11): o canvas do voo fica ABAIXO do cabeçalho e dos cartões
 * flutuantes, e acima do conteúdo da página. Os valores são lidos dos arquivos reais, para que a ordem
 * não dependa de um número solto aqui.
 */
const raiz = resolve(__dirname, '../../src');
const ler = (arquivo: string): string => readFileSync(resolve(raiz, arquivo), 'utf-8');

function zIndexDe(conteudo: string, seletor: string): number {
  const i = conteudo.indexOf(`${seletor} {`);
  if (i < 0) throw new Error(`seletor ausente: ${seletor}`);
  const bloco = conteudo.slice(i, conteudo.indexOf('}', i));
  const m = /z-index:\s*(\d+)/.exec(bloco);
  if (!m) throw new Error(`sem z-index em ${seletor}`);
  return Number(m[1]);
}

describe('empilhamento do voo', () => {
  const zVoo = Number(/--pir-z-voo:\s*(\d+)/.exec(ler('ui/piramide3d/estilo.css'))?.[1] ?? NaN);
  const zCabecalho = zIndexDe(ler('ui/layout/BarraTopo.vue'), '.barra-topo');
  const zFlutuante = zIndexDe(ler('ui/layout/LayoutBase.vue'), '.layout-base__inferior');

  it('o token do voo existe e é um inteiro positivo', () => {
    expect(Number.isInteger(zVoo)).toBe(true);
    expect(zVoo).toBeGreaterThan(0);
  });

  it('o voo fica abaixo do cabeçalho', () => {
    expect(zVoo).toBeLessThan(zCabecalho);
  });

  it('o voo fica abaixo dos cartões flutuantes (7 dias e Home)', () => {
    expect(zVoo).toBeLessThan(zFlutuante);
  });

  it('o canvas do voo usa o token, não um número solto', () => {
    const estilo = ler('ui/piramide3d/estilo.css');
    expect(estilo).toMatch(/\.pir-tela--voo \{[^}]*z-index:\s*var\(--pir-z-voo\)/);
  });
});
