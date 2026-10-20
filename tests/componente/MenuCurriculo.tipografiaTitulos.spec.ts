// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Rótulos de período e de cadeira no menu lateral usam Cormorant (título do
 * site, decisão do líder de 20/10/2026), com numerais lining, como no
 * protótipo aprovado (mockups/home-neoclassica.html, `.menu-curriculo__nivel-1`
 * e `__nivel-2`). Unidades e abas seguem em Inter. jsdom não aplica CSS
 * scoped (css:false), então a prova aqui é a da regra no fonte; o tamanho
 * real é conferido em navegador.
 *
 * No modo de leitura adaptada nada muda: essas regras ficam atrás de
 * `:root:not([data-modo-adaptado='on'])`, e o modo adaptado segue com o que
 * já define para o menu (escala própria, sem família nova).
 */
const fonte = readFileSync(
  resolve(__dirname, '../../src/ui/componentes/MenuCurriculo.vue'),
  'utf-8'
);

const FORA_DO_ADAPTADO = ":root:not\\(\\[data-modo-adaptado='on'\\]\\)";

function regraDe(seletor: RegExp): string {
  const achado = fonte.match(seletor);
  expect(achado, `regra não encontrada: ${seletor}`).not.toBeNull();
  return achado![1]!;
}

describe('MenuCurriculo, tipografia de título nos rótulos de período e de cadeira', () => {
  it('o rótulo de período (nível 1) usa Cormorant com numerais lining, como no protótipo', () => {
    const corpo = regraDe(
      new RegExp(
        `${FORA_DO_ADAPTADO}\\s+\\.menu-curriculo__nivel-1\\s*>\\s*li\\s*>\\s*\\.menu-curriculo__botao[^{]*\\{([^}]*)\\}`
      )
    );
    expect(corpo).toMatch(/font-family:\s*var\(--fonte-titulo\)/);
    expect(corpo).toMatch(/font-variant-numeric:\s*lining-nums/);
    expect(corpo).toMatch(/font-weight:\s*700/);
    expect(corpo).toMatch(/font-size:\s*1\.25rem/);
  });

  it('o rótulo de cadeira (nível 2, botão e link restrito) usa Cormorant, peso 600', () => {
    const corpo = regraDe(
      new RegExp(
        `${FORA_DO_ADAPTADO}\\s+\\.menu-curriculo__nivel-2\\s*>\\s*li\\s*>\\s*(?:\\.menu-curriculo__botao|a)[^{]*\\{([^}]*)\\}`
      )
    );
    expect(corpo).toMatch(/font-family:\s*var\(--fonte-titulo\)/);
    expect(corpo).toMatch(/font-variant-numeric:\s*lining-nums/);
    expect(corpo).toMatch(/font-weight:\s*600/);
    expect(corpo).toMatch(/font-size:\s*1\.1875rem/);
  });

  it('unidades e abas não ganham Cormorant', () => {
    const familiaDeTitulo = /font-family:\s*var\(--fonte-titulo\)/;
    const blocos = fonte.match(/\.menu-curriculo[^{]*\{[^}]*\}/g) ?? [];
    const comTitulo = blocos.filter((bloco) => familiaDeTitulo.test(bloco));
    for (const bloco of comTitulo) {
      expect(bloco).toMatch(/nivel-[12]/);
    }
  });
});
