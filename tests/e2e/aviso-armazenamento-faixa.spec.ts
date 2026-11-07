import { test, expect } from './apoio/sessaoDoEstudo';

/**
 * Faixa do aviso de armazenamento na primeira visita (sem a chave de "já visto").
 *
 * A faixa fica no fluxo, presa à base da janela, e a pilha inferior (faixa, quadro
 * de prova, botão Home) sobe junto com ela. Faixa alta demais cobre o campo de
 * busca logo na primeira visita (regressão medida em 07/11/2026: no HEAD a faixa
 * tinha 391 px e cobria o centro do campo; na v1.5.0.0 tinha 187 px).
 *
 * Referência medida na v1.5.0.0, mesmo critério:
 * - 1280x720: faixa de 187 px, topo em 232 px; campo de busca em 20 a 64 px, sem cobertura.
 * - 360x640: faixa de 238 px, topo em 101 px; já cobria o campo (113 a 157 px). A regra
 *   aqui é não subir além disso.
 */
const ALTURA_MAXIMA_1280 = 187;
const TOPO_MINIMO_360 = 101;

test('1280x720: a faixa não cobre o campo de busca na primeira visita e não passa de 187 px', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/busca');
  const campo = page.locator('#campo-busca-input');
  await campo.waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  const faixa = page.locator('.aviso-armazenamento');
  await expect(faixa).toBeVisible();

  const coberto = await campo.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const noCentro = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return Boolean(noCentro?.closest('.aviso-armazenamento'));
  });
  expect(coberto).toBe(false);

  const caixa = await faixa.boundingBox();
  expect(caixa).not.toBeNull();
  expect(caixa!.height).toBeLessThanOrEqual(ALTURA_MAXIMA_1280);
});

test('360x640: a faixa não sobe além do topo que tinha na v1.5.0.0', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/busca');
  await page.locator('#campo-busca-input').waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  const caixa = await page.locator('.aviso-armazenamento').boundingBox();
  expect(caixa).not.toBeNull();
  expect(caixa!.y).toBeGreaterThanOrEqual(TOPO_MINIMO_360);
});
