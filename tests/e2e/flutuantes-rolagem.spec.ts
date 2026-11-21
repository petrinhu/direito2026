import { expect, test } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * FLUTUANTES-ROLAGEM (ordem do líder, 21/11/2026): a 360 px, a pilha inferior (cartão do quadro de
 * prova e botão Home) some ao rolar para baixo e volta ao rolar para cima. Escondida, sai da
 * ordem de Tab: o foco não cai nela.
 */
const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const KELSEN = '/p/p1/intr-direito/u3-livro-teoria-pura-norma-fundamental';
const PILHA = '.layout-base__inferior';
const CLASSE_ESCONDIDA = /layout-base__inferior--escondida/;

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(DATA_FIXA));
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(KELSEN);
  await page.locator('main h1').first().waitFor({ state: 'visible' });
  await esperarLayoutAssentar(page);
});

test('rolar para baixo esconde a pilha; subir mostra de novo', async ({ page }) => {
  await expect(page.locator(PILHA)).not.toHaveClass(CLASSE_ESCONDIDA);

  await page.mouse.move(180, 320);
  await page.mouse.wheel(0, 500);
  await expect(page.locator(PILHA)).toHaveClass(CLASSE_ESCONDIDA);

  await page.mouse.wheel(0, -200);
  await expect(page.locator(PILHA)).not.toHaveClass(CLASSE_ESCONDIDA);
});

test('parar de rolar mostra a pilha de novo, depois da espera', async ({ page }) => {
  await page.mouse.move(180, 320);
  await page.mouse.wheel(0, 500);
  await expect(page.locator(PILHA)).toHaveClass(CLASSE_ESCONDIDA);
  await expect(page.locator(PILHA)).not.toHaveClass(CLASSE_ESCONDIDA, { timeout: 2000 });
});

test('com a pilha escondida, o Tab não para nela', async ({ page }) => {
  await page.mouse.move(180, 320);
  await page.mouse.wheel(0, 500);
  await expect(page.locator(PILHA)).toHaveClass(CLASSE_ESCONDIDA);

  await page.locator('main').first().focus();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const dentroDaPilha = await page.evaluate(
      () => !!document.activeElement?.closest('.layout-base__inferior')
    );
    expect(dentroDaPilha, `Tab ${i + 1} caiu na pilha escondida`).toBe(false);
  }
});
