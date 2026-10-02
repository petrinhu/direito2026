import { expect, test, type Page } from '@playwright/test';
import { prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * Mapa mental visual em markmap (ordem do líder, 01/10/2026: biblioteca
 * pronta no lugar do SVG próprio): o mapa aparece com os pensadores, clicar
 * abre o ramo, os botões alternam todos os ramos e centralizam, a lista
 * continua disponível, e no modo adaptado a lista vem primeiro.
 */
const BASE = '/p/p1/filosofia-juridica/u1';

const no = (page: Page, texto: string) => page.locator('.markmap-node', { hasText: texto }).first();

const modoDePensar = (page: Page) =>
  page.locator('.mapa-visual__svg').getByText('Modo de pensar:', { exact: true });

async function escala(page: Page): Promise<number> {
  const t = (await page.locator('.mapa-visual__svg > g').getAttribute('transform')) ?? '';
  return Number(/scale\(([\d.]+)\)/.exec(t)![1]);
}

test('o mapa visual aparece com a raiz, os períodos e os pensadores', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  await expect(page.locator('.mapa-visual__svg')).toBeVisible();
  await expect(no(page, 'Filosofia Jurídica')).toBeVisible();
  await expect(no(page, 'Idade Antiga')).toBeVisible();
  await expect(no(page, 'Platão')).toBeVisible();
  await expect(modoDePensar(page)).toHaveCount(0);
});

test('clicar num pensador abre o ramo e mostra o modo de pensar; clicar de novo fecha', async ({
  page
}) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  const platao = no(page, 'Platão (');
  await platao.locator('circle').click();
  await expect(modoDePensar(page).first()).toBeVisible();
  await platao.locator('circle').click();
  await expect(modoDePensar(page)).toHaveCount(0);
});

test('o botão alterna todos os ramos e o rótulo muda na hora', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  const botao = page.locator('button.mapa-visual__todos');
  await expect(botao).toHaveText('Abrir todos os ramos');
  await expect(botao).toHaveAttribute('aria-expanded', 'false');
  await botao.click();
  await expect(botao).toHaveText('Recolher todos os ramos');
  await expect(botao).toHaveAttribute('aria-expanded', 'true');
  await expect(modoDePensar(page).first()).toBeVisible();
  await botao.click();
  await expect(botao).toHaveText('Abrir todos os ramos');
  await expect(modoDePensar(page)).toHaveCount(0);
});

test('Centralizar volta ao enquadramento depois de arrastar o mapa', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  await expect(no(page, 'Platão')).toBeVisible();
  await page.waitForTimeout(500);
  const antes = await page.locator('.mapa-visual__svg > g').getAttribute('transform');
  const caixa = (await page.locator('.mapa-visual__svg').boundingBox())!;
  await page.mouse.move(caixa.x + 20, caixa.y + 20);
  await page.mouse.down();
  await page.mouse.move(caixa.x + 120, caixa.y + 90, { steps: 5 });
  await page.mouse.up();
  expect(await page.locator('.mapa-visual__svg > g').getAttribute('transform')).not.toBe(antes);
  await page.getByRole('button', { name: 'Centralizar' }).click();
  await expect
    .poll(async () => page.locator('.mapa-visual__svg > g').getAttribute('transform'), {
      timeout: 5000
    })
    .toBe(antes);
});

test('"Ver em lista" mostra a árvore acessível e "Ver mapa visual" volta', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  await page.getByRole('button', { name: 'Ver em lista' }).click();
  await expect(page.locator('[role="tree"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver mapa visual' })).toBeVisible();
  const botao = page.locator('button.mapa-mental__acao');
  await expect(botao).toHaveText('Abrir todos os ramos');
  await botao.click();
  await expect(botao).toHaveText('Recolher todos os ramos');
  await page.getByRole('button', { name: 'Ver mapa visual' }).click();
  await expect(page.locator('.mapa-visual__svg')).toBeVisible();
});

test('modo adaptado: abre direto a lista, e o mapa visual é opcional', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
  await page.goto(`${BASE}/mapa`);
  await expect(page.locator('[role="tree"]')).toBeVisible();
  await expect(page.locator('.mapa-visual__svg')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver mapa visual' }).click();
  await expect(page.locator('.mapa-visual__svg')).toBeVisible();
});

for (const aba of ['', '/mapa', '/fichamento', '/mnemonicos', '/quiz']) {
  test(`modo adaptado, página inteira${aba || ' /resumo'}: nenhum elemento usa o azul-marinho da marca`, async ({
    page
  }) => {
    await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
    await page.goto(`${BASE}${aba}`);
    await page.locator('h1').waitFor({ state: 'visible' });
    if (aba === '/mapa') await page.locator('[role="tree"]').waitFor({ state: 'visible' });
    const comAzul = async () =>
      page.evaluate(() => {
        const marca = 'rgb(13, 36, 64)';
        return [...document.querySelectorAll('body, body *')]
          .filter((el) => {
            const e = getComputedStyle(el);
            return [
              e.color,
              e.backgroundColor,
              e.borderTopColor,
              e.borderLeftColor,
              e.borderBottomColor,
              e.fill,
              e.stroke,
              e.outlineColor
            ].includes(marca);
          })
          .map((el) => `${el.tagName}.${String((el as HTMLElement).className)}`);
      });
    expect(await comAzul()).toEqual([]);
    if (aba === '/mapa') {
      await page.getByRole('button', { name: 'Ver mapa visual' }).click();
      await page.locator('.mapa-visual__svg').waitFor({ state: 'visible' });
      expect(await comAzul(), 'mapa visual').toEqual([]);
    }
  });
}

test('360px: sem rolagem lateral e texto com pelo menos 12px efetivos', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  await expect(no(page, 'Platão')).toBeVisible();
  for (const acao of ['inicial', 'aberto']) {
    if (acao === 'aberto') await page.locator('button.mapa-visual__todos').click();
    await page.waitForTimeout(700);
    const k = await escala(page);
    const fonte = await page
      .locator('.mapa-visual__svg .markmap-foreign')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fonte * k, acao).toBeGreaterThanOrEqual(11.5);
    const sobra = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(sobra, `rolagem lateral (${acao})`).toBeLessThanOrEqual(0);
  }
});
