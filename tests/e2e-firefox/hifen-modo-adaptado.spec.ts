import type { Page } from '@playwright/test';
import { test, expect } from '../e2e/apoio/sessaoDoEstudo';
import { prepararEstadoInicial, esperarLayoutAssentar } from '../e2e/apoio/estadoInicial';

/**
 * Hifenização do modo adaptado (AV3-F0c-HIFEN, TODO.md). O Chromium desta máquina não
 * hifeniza pt-BR, por isso a medida de "quebrou palavra" só vale no Firefox. Duas partes:
 *
 * 1. Controle: uma caixa de 70 px com a palavra longa e `hyphens: auto` tem de ocupar mais de
 *    uma linha; a mesma caixa com `hyphens: none` tem de ficar em uma linha só. Se o controle
 *    falha, o Firefox não tem dicionário pt-BR: é um achado do navegador, não defeito do produto.
 * 2. Produto: no menu adaptado a 360 px, com o `overflow-wrap` do produto anulado (para que só o
 *    hífen possa quebrar palavra), algum rótulo tem de quebrar DENTRO de uma palavra. O texto
 *    do menu não pode ganhar U+00AD (acessibilidade: leitor de tela e busca leem o texto puro).
 */
const PALAVRA_LONGA = 'inconstitucionalidade';

/** Conta as linhas ocupadas pela palavra numa caixa de 70 px com o estilo dado. */
async function linhasDaPalavra(page: Page, estilo: string): Promise<number> {
  return page.evaluate(
    ({ palavra, estilo }) => {
      const caixa = document.createElement('div');
      caixa.style.cssText = `position:absolute;left:0;top:0;width:70px;font:16px/1.4 sans-serif;${estilo}`;
      caixa.textContent = palavra;
      document.body.appendChild(caixa);
      try {
        const texto = caixa.firstChild;
        if (!texto) throw new Error('caixa de medida sem texto');
        const tops = new Set<number>();
        for (let i = 0; i < palavra.length; i++) {
          const faixa = document.createRange();
          faixa.setStart(texto, i);
          faixa.setEnd(texto, i + 1);
          for (const r of Array.from(faixa.getClientRects())) tops.add(Math.round(r.top));
        }
        return tops.size;
      } finally {
        caixa.remove();
      }
    },
    { palavra: PALAVRA_LONGA, estilo }
  );
}

/** Abre todo botão de expandir visível do menu, com limite de voltas. */
async function abrirTodoOMenu(page: Page, largura: number): Promise<void> {
  if (largura <= 880) {
    await page.locator('.barra-topo__botao-gaveta').click();
  }
  const menu = page.locator('nav[aria-label="Currículo"]');
  for (let volta = 0; volta < 200; volta++) {
    const fechado = menu.locator('button[aria-expanded="false"]:visible').first();
    if ((await fechado.count()) === 0) return;
    await fechado.click();
  }
  throw new Error('o menu não terminou de abrir em 200 cliques (laço sem fim?)');
}

test.describe('hifenização do modo adaptado no Firefox', () => {
  test('controle: a palavra longa quebra em 2 linhas com hyphens: auto e fica em 1 com hyphens: none, em 70 px', async ({
    page
  }) => {
    await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
    await page.goto('/');
    await esperarLayoutAssentar(page);

    const idioma = await page.evaluate(() => document.documentElement.lang);
    expect(idioma, 'o documento precisa de lang="pt-BR" para hifenizar').toBe('pt-BR');

    const linhasSemHifen = await linhasDaPalavra(
      page,
      'hyphens:none;overflow-wrap:normal;word-break:normal;'
    );
    expect(linhasSemHifen, 'sem hífen a palavra longa tem de ficar numa linha só').toBe(1);

    const linhasComHifen = await linhasDaPalavra(
      page,
      'hyphens:auto;overflow-wrap:normal;word-break:normal;'
    );
    expect(
      linhasComHifen,
      'com hyphens: auto a palavra tem de quebrar em 2 linhas ou mais; se ficou em 1, este Firefox não tem o dicionário pt-BR'
    ).toBeGreaterThanOrEqual(2);
  });

  test('produto: no menu adaptado a 360 px, algum rótulo quebra dentro da palavra, sem U+00AD no texto', async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
    await page.goto('/');
    await abrirTodoOMenu(page, 360);
    await esperarLayoutAssentar(page);

    const menu = page.locator('nav[aria-label="Currículo"]');
    const hifenDoProduto = await menu.evaluate((nav) => getComputedStyle(nav).hyphens);
    expect(hifenDoProduto, 'o menu adaptado tem de estar com hyphens: auto').toBe('auto');

    // Anula o overflow-wrap do produto (anywhere): só o hífen pode quebrar palavra daqui em diante.
    await menu.evaluate(() => {
      const estilo = document.createElement('style');
      estilo.id = 'sonda-so-hifen';
      estilo.textContent =
        'nav[aria-label="Currículo"] *{overflow-wrap:normal !important;word-break:normal !important}';
      document.head.appendChild(estilo);
    });

    const quebrasNoMeio = await menu.evaluate((nav) => {
      const achados: string[] = [];
      const percurso = document.createTreeWalker(nav, window.NodeFilter.SHOW_TEXT);
      for (let no = percurso.nextNode(); no; no = percurso.nextNode()) {
        const texto = no.textContent ?? '';
        if (!/\p{L}{2}/u.test(texto)) continue;
        let topoAnterior: number | null = null;
        for (let i = 0; i < texto.length; i++) {
          const faixa = document.createRange();
          faixa.setStart(no, i);
          faixa.setEnd(no, i + 1);
          const r = faixa.getClientRects()[0];
          if (!r || r.width === 0) continue;
          const topo = Math.round(r.top);
          const anterior = texto[i - 1] ?? '';
          const atual = texto[i] ?? '';
          if (
            topoAnterior !== null &&
            topo !== topoAnterior &&
            /\p{L}/u.test(anterior) &&
            /\p{L}/u.test(atual)
          ) {
            achados.push(texto.trim().slice(0, 80));
            break;
          }
          topoAnterior = topo;
        }
      }
      return achados;
    });
    expect(
      quebrasNoMeio.length,
      'nenhum rótulo do menu adaptado a 360 px quebrou dentro de uma palavra: a hifenização não apareceu'
    ).toBeGreaterThan(0);

    const textoDoMenu = (await menu.textContent()) ?? '';
    expect(textoDoMenu, 'o texto do menu não pode ganhar U+00AD (hífen suave)').not.toContain('­');
  });
});
