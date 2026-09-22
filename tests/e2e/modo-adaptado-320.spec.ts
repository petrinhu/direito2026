import { test, expect } from '@playwright/test';

/**
 * Critério 2 da especificação (docs/modo-adaptado.md, seção 8): em 320px de
 * largura CSS, com o modo adaptado ligado, nenhuma rolagem horizontal da
 * página. Mesmo padrão de tests/e2e/responsividade-360.spec.ts (layout
 * real, por isso Playwright, não jsdom), mas ligando o modo ANTES de medir,
 * via a mesma chave de localStorage que o repositório real usa
 * (src/app/persistencia/RepositorioLocalStorage.ts, prefixo
 * "caderno-direito:v1").
 */
test.use({ viewport: { width: 320, height: 800 } });

async function ligarModoAdaptado(page: import('@playwright/test').Page, caminho: string) {
  await page.addInitScript(() => {
    localStorage.setItem('caderno-direito:v1:modo-adaptado', 'true');
  });
  await page.goto(caminho);
}

test('em 320px, com o modo adaptado ligado, a home não estoura a largura', async ({ page }) => {
  await ligarModoAdaptado(page, '/');
  await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });

  const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
  const larguraJanela = await page.evaluate(() => document.documentElement.clientWidth);

  expect(larguraDocumento, `scrollWidth ${larguraDocumento} vs clientWidth ${larguraJanela}`).toBe(
    larguraJanela
  );
});

test('em 320px, com o modo adaptado ligado, a página de unidade não estoura a largura', async ({
  page
}) => {
  await ligarModoAdaptado(page, '/p/p1/intr-direito/u1');
  await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
  await page.locator('table').first().waitFor({ state: 'attached' });

  const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
  const larguraJanela = await page.evaluate(() => document.documentElement.clientWidth);

  expect(larguraDocumento, `scrollWidth ${larguraDocumento} vs clientWidth ${larguraJanela}`).toBe(
    larguraJanela
  );
});
