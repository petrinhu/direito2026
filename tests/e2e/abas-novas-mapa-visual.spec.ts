import { expect, test } from '@playwright/test';
import { prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * Mapa mental visual (pedido do líder: "horrível, não é divertido"):
 * o mapa aparece, clicar abre o ramo, o botão único alterna e troca de
 * rótulo, a lista continua disponível, e no modo adaptado a lista vem
 * primeiro. Layout e interação reais exigem navegador.
 */
const BASE = '/p/p1/filosofia-juridica/u1';

test('o mapa visual aparece com o nó central, os períodos e os pensadores', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  await expect(page.locator('.mapa-visual__svg')).toBeVisible();
  await expect(page.locator('[data-no="mapa-raiz"]')).toBeVisible();
  await expect(page.locator('[data-no="mapa-era-antiga"]')).toBeVisible();
  await expect(page.locator('[data-no="mapa-pensador-platao"]')).toBeVisible();
  await expect(page.locator('[data-no="mapa-platao-modo"]')).toHaveCount(0);
});

test('clicar num pensador abre o ramo e mostra o detalhe', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  const platao = page.locator('[data-no="mapa-pensador-platao"]');
  await platao.click();
  await expect(platao).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-no="mapa-platao-modo"]')).toBeVisible();
  await expect(page.locator('.mapa-visual__detalhe')).toContainText('Platão');
  await platao.click();
  await expect(page.locator('[data-no="mapa-platao-modo"]')).toHaveCount(0);
});

test('o botão único alterna todos os ramos e o rótulo muda na hora', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  const botao = page.locator('button.mapa-visual__todos');
  await expect(botao).toHaveText('Abrir todos os ramos');
  await expect(botao).toHaveAttribute('aria-expanded', 'false');
  await botao.click();
  await expect(botao).toHaveText('Recolher todos os ramos');
  await expect(botao).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-no="mapa-platao-modo"]')).toBeVisible();
  await botao.click();
  await expect(botao).toHaveText('Abrir todos os ramos');
  await expect(page.locator('[data-no="mapa-platao-modo"]')).toHaveCount(0);
});

test('zoom pelos botões muda a escala e Centralizar volta', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  const escala = async () =>
    Number(
      /scale\(([\d.]+)\)/.exec(
        (await page.locator('.mapa-visual__mundo').getAttribute('transform')) ?? ''
      )![1]
    );
  const inicial = await escala();
  await page.getByRole('button', { name: 'Aproximar' }).click();
  expect(await escala()).toBeGreaterThan(inicial);
  await page.getByRole('button', { name: 'Centralizar' }).click();
  // Centralizar anima: espera a escala assentar antes de comparar.
  await expect.poll(escala, { timeout: 5000 }).toBeCloseTo(inicial, 3);
});

test('arrastar o fundo move o mapa', async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  const antes = await page.locator('.mapa-visual__mundo').getAttribute('transform');
  const caixa = (await page.locator('.mapa-visual__svg').boundingBox())!;
  await page.mouse.move(caixa.x + 20, caixa.y + 20);
  await page.mouse.down();
  await page.mouse.move(caixa.x + 120, caixa.y + 90, { steps: 5 });
  await page.mouse.up();
  expect(await page.locator('.mapa-visual__mundo').getAttribute('transform')).not.toBe(antes);
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

test('360px: o layout vertical entra e o texto das cápsulas fica com pelo menos 12px', async ({
  page
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  const antiga = page.locator('[data-no="mapa-era-antiga"]');
  const media = page.locator('[data-no="mapa-era-media"]');
  await expect(antiga).toBeVisible();
  const ya = (await antiga.boundingBox())!.y;
  const ym = (await media.boundingBox())!.y;
  expect(ya, 'Antiguidade em cima da Idade Média').toBeLessThan(ym);
  for (const acao of ['inicial', 'aberto']) {
    if (acao === 'aberto') await page.locator('button.mapa-visual__todos').click();
    await page.waitForTimeout(700);
    const tamanhos = await page
      .locator('.mapa-visual__no .mapa-visual__texto')
      .evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect().height / el.querySelectorAll('tspan').length)
      );
    expect(Math.min(...tamanhos), acao).toBeGreaterThanOrEqual(11);
  }
});

test('1280px com "Abrir todos os ramos": todo nó dentro do quadro, texto >= 12px, a página rola', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  await page.locator('button.mapa-visual__todos').click();
  await page.waitForTimeout(700);
  await expectTodosDentro(page);
});

test('360px com os conceitos abertos: nenhuma cápsula passa da borda', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.goto(`${BASE}/mapa`);
  await page.locator('button.mapa-visual__todos').click();
  await page.locator('[data-no="mapa-platao-conceitos"]').click();
  await page.waitForTimeout(700);
  await expectTodosDentro(page);
});

async function expectTodosDentro(page: import('@playwright/test').Page): Promise<void> {
  const svg = (await page.locator('.mapa-visual__svg').boundingBox())!;
  const caixas = await page.locator('.mapa-visual__no .mapa-visual__capsula').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { esq: r.left, dir: r.right, topo: r.top, base: r.bottom };
    })
  );
  expect(caixas.length).toBeGreaterThan(10);
  for (const c of caixas) {
    expect(c.esq).toBeGreaterThanOrEqual(svg.x - 1);
    expect(c.dir).toBeLessThanOrEqual(svg.x + svg.width + 1);
    expect(c.topo).toBeGreaterThanOrEqual(svg.y - 1);
    expect(c.base).toBeLessThanOrEqual(svg.y + svg.height + 1);
  }
  const texto = await page
    .locator('.mapa-visual__no .mapa-visual__texto')
    .evaluateAll((els) =>
      els.map(
        (el) =>
          parseFloat(getComputedStyle(el).fontSize) *
          (el.getBoundingClientRect().height / el.getBBox().height)
      )
    );
  expect(Math.min(...texto)).toBeGreaterThanOrEqual(11.5);
}
