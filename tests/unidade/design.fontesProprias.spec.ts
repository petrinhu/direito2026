import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Item 5 da onda (pendência, não a especificação do modo adaptado): o site
 * usava só a pilha de fontes do sistema; docs/design-visual.md já pedia
 * Lora/Inter "hospedada no próprio site". As duas fontes já vinham como
 * devDependency (@fontsource/lora, @fontsource-variable/inter) — este
 * teste prova que os arquivos recortados existem, ficam dentro do teto de
 * scripts/verificar-fontes.sh (60KB) e que os tokens realmente os usam
 * (nunca só a pilha de sistema).
 */
const RAIZ = resolve(__dirname, '../..');
const TETO_BYTES = 60 * 1024;

const ARQUIVOS_ESPERADOS = [
  'public/assets/fontes/inter-400.woff2',
  'public/assets/fontes/inter-500.woff2',
  'public/assets/fontes/inter-700.woff2',
  'public/assets/fontes/lora-700.woff2'
];

describe('fontes próprias (Lora/Inter), self-hosted, sem CDN', () => {
  it.each(ARQUIVOS_ESPERADOS)('%s existe e fica abaixo de 60KB', (caminhoRelativo) => {
    const caminho = resolve(RAIZ, caminhoRelativo);
    expect(existsSync(caminho), `arquivo ausente: ${caminho}`).toBe(true);
    const tamanho = statSync(caminho).size;
    expect(tamanho).toBeLessThanOrEqual(TETO_BYTES);
  });

  it('fontes.css não referencia nenhuma origem externa (CDN)', () => {
    const css = readFileSync(resolve(RAIZ, 'src/ui/estilos/fontes.css'), 'utf-8');
    expect(css).not.toMatch(/https?:\/\//);
    expect(css).toMatch(/url\('\/assets\/fontes\/inter-400\.woff2'\)/);
    expect(css).toMatch(/url\('\/assets\/fontes\/lora-700\.woff2'\)/);
  });

  it('tokens.css usa Lora/Inter como fonte primária (não só a pilha de sistema)', () => {
    const css = readFileSync(resolve(RAIZ, 'src/ui/estilos/tokens.css'), 'utf-8');
    expect(css).toMatch(/--fonte-titulo:\s*'Lora'/);
    expect(css).toMatch(/--fonte-texto:\s*'Inter'/);
  });

  it('main.ts importa fontes.css', () => {
    const main = readFileSync(resolve(RAIZ, 'src/main.ts'), 'utf-8');
    expect(main).toMatch(/@\/ui\/estilos\/fontes\.css/);
  });
});
