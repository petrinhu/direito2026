import { test, expect } from './apoio/sessaoDoEstudo';

/**
 * Bloco do aviso de armazenamento na primeira visita (sem a chave de "já visto").
 *
 * Decisão do líder (07/11/2026): o aviso é um bloco no topo do conteúdo, que rola com a página. Não
 * é fixo nem sticky, então não cobre o campo de busca nem o menu. A regra de 187 px a 1280 vem da
 * v1.5.0.0 e continua valendo para a altura do bloco.
 */
const ALTURA_MAXIMA_1280 = 187;

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

test('360x640: o aviso é bloco do fluxo, antes do campo de busca, e rola com a página', async ({
  page
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/busca');
  await page.locator('#campo-busca-input').waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  const faixa = page.locator('.aviso-armazenamento');
  await expect(faixa).toBeVisible();
  const posicao = await faixa.evaluate((el) => getComputedStyle(el).position);
  expect(['static', 'relative']).toContain(posicao);
  const antesDoCampo = await page.evaluate(() => {
    const aviso = document.querySelector('.aviso-armazenamento');
    const campo = document.querySelector('#campo-busca-input');
    return Boolean(aviso && campo && aviso.compareDocumentPosition(campo) & 4);
  });
  expect(antesDoCampo).toBe(true);
});
