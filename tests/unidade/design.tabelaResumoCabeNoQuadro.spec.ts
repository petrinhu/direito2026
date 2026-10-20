import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Tabelas do Resumo cabem na largura do quadro em desktop e tablet, sem
 * barra de rolagem. Rolagem horizontal só existe no celular (<= 640px), com
 * dica visível (sombra na borda) e o quadro focável por teclado.
 *
 * Causa original: `table { min-width: max-content }` forçava a tabela à largura
 * de uma linha só (1512px em 1280px), e o quadro com `overflow-x: auto` sempre
 * rolava. Este teste lê a fonte, como os demais testes de estilo; a medida real
 * fica no e2e tests/e2e/responsividade-360.spec.ts.
 */

const CAMINHO_BLOCO = resolve(__dirname, '../../src/ui/componentes/BlocoTeorico.vue');
const RAIZ_CONTEUDO = resolve(__dirname, '../../src/conteudo');

function regraBase(css: string, seletor: string): string {
  const inicio = css.indexOf(`\n${seletor} {`);
  expect(inicio, `regra ${seletor} ausente`).toBeGreaterThanOrEqual(0);
  return css.slice(inicio, css.indexOf('}', inicio));
}

function blocoMidia(css: string, cabecalho: string, fimMidia: string): string {
  const inicio = css.indexOf(cabecalho);
  expect(inicio, `${cabecalho} ausente`).toBeGreaterThanOrEqual(0);
  const fim = css.indexOf(fimMidia, inicio);
  return css.slice(inicio, fim > inicio ? fim : undefined);
}

function arquivosResumo(diretorio: string): string[] {
  return readdirSync(diretorio, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(diretorio, entrada.name);
    if (entrada.isDirectory()) return arquivosResumo(caminho);
    return entrada.name === 'resumo.ts' ? [caminho] : [];
  });
}

describe('tabela do resumo: largura do quadro (desktop e tablet)', () => {
  // Comentários explicam a causa (cita max-content e nowrap de propósito); a regra vale só para o CSS.
  const css = readFileSync(CAMINHO_BLOCO, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');

  it('a tabela não é forçada à largura de uma linha só (sem min-width: max-content)', () => {
    expect(css).not.toContain('max-content');
  });

  it('a tabela ocupa 100% do quadro', () => {
    expect(regraBase(css, '.bloco-teorico__corpo :deep(table)')).toMatch(/width:\s*100%/);
  });

  it('nenhuma célula usa white-space: nowrap', () => {
    expect(css).not.toMatch(/white-space:\s*nowrap/);
  });

  it('quebra de palavra só com overflow-wrap: break-word nas células, nunca anywhere', () => {
    const celulas = regraBase(
      css,
      '.bloco-teorico__corpo :deep(th),\n.bloco-teorico__corpo :deep(td)'
    );
    expect(celulas).toContain('overflow-wrap: break-word');
    expect(css).not.toContain('overflow-wrap: anywhere');
  });

  it('o quadro da tabela não rola na regra base (desktop e tablet)', () => {
    const base = regraBase(css, '.bloco-teorico__corpo :deep(.tabela-rolavel)');
    expect(base).not.toMatch(/overflow-x:\s*auto/);
    expect(base).not.toContain('gradient');
  });

  it('a rolagem horizontal só existe dentro da media query de celular (<= 640px)', () => {
    const celular = blocoMidia(css, '@media (max-width: 640px)', '@media print');
    expect(celular).toMatch(
      /\.bloco-teorico__corpo :deep\(\.tabela-rolavel\)\s*\{[^}]*overflow-x:\s*auto/
    );
  });

  it('no celular, a dica de que rola é a sombra na borda (scroll shadow)', () => {
    const celular = blocoMidia(css, '@media (max-width: 640px)', '@media print');
    expect(celular).toContain('radial-gradient');
    expect(celular).toContain('local');
  });
});

describe('tabela do resumo: markup do quadro rolável (todas as unidades)', () => {
  const arquivos = arquivosResumo(RAIZ_CONTEUDO);

  it('há resumos com tabela para testar (piso de varredura não vazio, L-36)', () => {
    const totalTabelas = arquivos.reduce(
      (soma, arquivo) => soma + (readFileSync(arquivo, 'utf-8').match(/<table[\s>]/g) ?? []).length,
      0
    );
    expect(arquivos.length).toBeGreaterThan(0);
    expect(totalTabelas).toBeGreaterThan(0);
  });

  it('toda <table> do resumo está dentro de um quadro .tabela-rolavel (gêmeo de cada unidade)', () => {
    for (const arquivo of arquivos) {
      const fonte = readFileSync(arquivo, 'utf-8');
      const tabelas = (fonte.match(/<table[\s>]/g) ?? []).length;
      const quadros = (fonte.match(/class="tabela-rolavel"/g) ?? []).length;
      expect(quadros, arquivo).toBe(tabelas);
    }
  });

  it('cada quadro é focável por teclado e tem papel de região com nome', () => {
    for (const arquivo of arquivos) {
      const fonte = readFileSync(arquivo, 'utf-8');
      const quadros = fonte.match(/<div class="tabela-rolavel"[^>]*>/g) ?? [];
      for (const quadro of quadros) {
        expect(quadro, arquivo).toContain('tabindex="0"');
        expect(quadro, arquivo).toContain('role="region"');
        expect(quadro, arquivo).toMatch(/aria-label="[^"]+"/);
      }
    }
  });

  it('nenhum resumo força nowrap nem largura fixa na tabela', () => {
    for (const arquivo of arquivos) {
      const fonte = readFileSync(arquivo, 'utf-8');
      expect(fonte, arquivo).not.toMatch(/nowrap/);
      expect(fonte, arquivo).not.toMatch(/<(table|td|th)[^>]*style="[^"]*width/);
    }
  });
});
