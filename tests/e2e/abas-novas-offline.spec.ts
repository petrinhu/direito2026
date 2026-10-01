import { expect, test } from '@playwright/test';

/**
 * Abas novas de Filosofia Jurídica funcionam na segunda visita sem rede:
 * dados e componentes são chunks do próprio build, precacheados pelo
 * service worker (nenhuma biblioteca de fora, nenhum CDN). Mesmo padrão de
 * offline-segunda-visita.spec.ts.
 */
test('segunda visita às abas novas, com a rede desligada, ainda abre', async ({
  page,
  context
}) => {
  const base = '/p/p1/filosofia-juridica/u1';
  await page.goto(`${base}/mapa`);
  await expect(page.locator('[role="tree"]')).toBeVisible();
  await page.waitForFunction(
    async () => Boolean((await navigator.serviceWorker?.getRegistration())?.active),
    { timeout: 15_000 }
  );

  const MAX_RECARGAS = 12;
  let controlada = false;
  for (let tentativa = 0; tentativa < MAX_RECARGAS && !controlada; tentativa += 1) {
    if (tentativa > 0) await page.waitForTimeout(300);
    await page.reload();
    controlada = await page.evaluate(() => navigator.serviceWorker?.controller != null);
  }
  expect(controlada, 'página não ficou controlada pelo service worker').toBe(true);

  // Visita as outras duas abas ainda online, para o cache já tê-las.
  await page.goto(`${base}/fichamento`);
  await expect(page.locator('article.ficha').first()).toBeVisible();
  await page.goto(`${base}/mnemonicos`);
  await expect(page.locator('article.mnemonico').first()).toBeVisible();

  await context.setOffline(true);
  try {
    for (const [aba, seletor] of [
      ['mapa', '[role="tree"]'],
      ['fichamento', 'article.ficha'],
      ['mnemonicos', 'article.mnemonico']
    ] as const) {
      await page.goto(`${base}/${aba}`);
      await expect(page.locator(seletor).first()).toBeVisible({ timeout: 10_000 });
    }
  } finally {
    await context.setOffline(false);
  }
});
