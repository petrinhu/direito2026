import { test, expect } from '@playwright/test';

/**
 * Item 9 da onda: prova de ponta a ponta que a segunda visita, com a rede
 * desligada, abre uma unidade já visitada. Isto depende do service worker
 * (vite-plugin-pwa, vite.config.ts) estar de fato REGISTRADO em tempo de
 * execução - achado ao investigar este item: registerType/workbox
 * estavam configurados, mas nenhum código chamava registerSW() em lugar
 * nenhum (grep em src/ não encontrou nada antes desta correção), então o
 * service worker nunca instalava e a promessa de app-like/offline da PWA
 * não se cumpria. Corrigido em src/main.ts.
 *
 * Precisa do BUILD real (workbox só gera o SW em produção, não em `vite
 * dev`), por isso roda contra o mesmo `vite preview` que o resto de
 * tests/e2e/ usa (playwright.config.ts, webServer).
 */
test('segunda visita a uma unidade já visitada, com a rede desligada, ainda abre', async ({
  page,
  context
}) => {
  await page.goto('/p/p1/intr-direito/u1');
  await expect(page.locator('h1, h2').first()).toBeVisible();

  // O service worker instala e ativa na PRIMEIRA carga, mas a página que
  // disparou o registro nunca é controlada por ele (regra da própria
  // spec de service worker). Medido nesta máquina (Chromium headless):
  // mesmo depois de 'active' virar true, a PRIMEIRA recarga ainda não
  // basta - o navegador leva mais um ciclo de navegação para assumir o
  // novo worker como controlador de fato. Por isso recarrega em laço,
  // limitado, até `controller` virar não-nulo, em vez de supor que uma
  // única recarga resolve.
  await page.waitForFunction(
    async () => Boolean((await navigator.serviceWorker?.getRegistration())?.active),
    { timeout: 15_000 }
  );

  // Sob carga (suíte inteira em paralelo, vários workers batendo no mesmo
  // `vite preview`), o número de recargas necessário varia mais do que
  // isolado - por isso o orçamento é generoso (12) e cada tentativa dá um
  // respiro curto antes da recarga seguinte, em vez de martelar sem
  // pausa.
  const MAX_RECARGAS = 12;
  let controlada = false;
  for (let tentativa = 0; tentativa < MAX_RECARGAS && !controlada; tentativa += 1) {
    if (tentativa > 0) await page.waitForTimeout(300);
    await page.reload();
    controlada = await page.evaluate(() => navigator.serviceWorker?.controller != null);
  }
  expect(controlada, `página não ficou controlada pelo service worker em ${MAX_RECARGAS} recargas`).toBe(
    true
  );

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
    // Prova que é conteúdo real da unidade, não a página de erro do
    // navegador nem NaoEncontrado.vue.
    await expect(page.locator('table').first()).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
