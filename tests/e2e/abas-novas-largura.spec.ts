import { expect, test } from '@playwright/test';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * Critério do líder: sem rolagem lateral da PÁGINA em 320px e 360px, nos
 * dois modos (normal e adaptado), nas três abas novas. O próprio mapa pode
 * rolar dentro do contêiner dele. No modo adaptado, texto de 24px, alvos de
 * 44px e nenhuma animação. jsdom não faz layout, por isso Playwright.
 */
const BASE = '/p/p1/filosofia-juridica/u1';
const ABAS = ['mapa', 'fichamento', 'mnemonicos'] as const;
const LARGURAS = [320, 360] as const;

for (const largura of LARGURAS) {
  for (const adaptado of [false, true]) {
    for (const aba of ABAS) {
      test(`${largura}px, ${adaptado ? 'modo adaptado' : 'modo normal'}, /${aba}: a página não rola de lado e as abas cabem`, async ({
        page
      }) => {
        await page.setViewportSize({ width: largura, height: 800 });
        await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: adaptado });
        await page.goto(`${BASE}/${aba}`);
        await page.locator(`#painel-${aba}`).waitFor({ state: 'visible' });
        if (aba === 'mapa') {
          await page.getByRole('button', { name: 'Abrir todos os ramos' }).click();
        }
        if (aba === 'fichamento') {
          await page.getByRole('button', { name: 'Abrir todas as fichas' }).click();
        }
        if (aba === 'mnemonicos') {
          for (const botao of await page.locator('button.mnemonico__botao').all()) {
            await botao.click();
          }
        }
        await esperarLayoutAssentar(page);

        const medidas = await page.evaluate(() => ({
          documento: document.documentElement.scrollWidth,
          janela: document.documentElement.clientWidth
        }));
        expect(medidas.documento, `scrollWidth ${medidas.documento} vs ${medidas.janela}`).toBe(
          medidas.janela
        );

        const abaForaDaTela = await page
          .locator('[role="tab"]')
          .evaluateAll(
            (abas) =>
              abas
                .map((a) => a.getBoundingClientRect())
                .filter((r) => r.left < 0 || r.right > document.documentElement.clientWidth).length
          );
        expect(abaForaDaTela, 'abas fora da janela').toBe(0);
      });
    }
  }
}

test('modo adaptado: texto do mapa em 24px e alvos de 44px nos botões e nas abas novas', async ({
  page
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
  await page.goto(`${BASE}/mapa`);
  await page.getByRole('button', { name: 'Abrir todos os ramos' }).click();
  const fonte = await page
    .locator('#mapa-platao-modo .no-mapa__detalhe')
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(fonte).toBeGreaterThanOrEqual(24);

  for (const seletor of ['button.mapa-mental__acao', '#mapa-era-antiga .no-mapa__corpo']) {
    for (const el of await page.locator(seletor).all()) {
      const caixa = await el.boundingBox();
      expect(caixa!.height, seletor).toBeGreaterThanOrEqual(44);
    }
  }

  await page.goto(`${BASE}/fichamento`);
  for (const seletor of [
    'button.fichamento__acao',
    'button.ficha__botao',
    'select.fichamento__periodo',
    'input.fichamento__busca'
  ]) {
    for (const el of await page.locator(seletor).all()) {
      const caixa = await el.boundingBox();
      expect(caixa!.height, seletor).toBeGreaterThanOrEqual(44);
    }
  }
  await page.goto(`${BASE}/mnemonicos`);
  for (const el of await page.locator('button.mnemonico__botao').all()) {
    const caixa = await el.boundingBox();
    expect(caixa!.height).toBeGreaterThanOrEqual(44);
  }
});

test('modo adaptado: nenhuma animação em andamento nas três abas', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
  for (const aba of ABAS) {
    await page.goto(`${BASE}/${aba}`);
    await esperarLayoutAssentar(page);
    const animando = await page.evaluate(() => document.getAnimations().length);
    expect(animando, aba).toBe(0);
  }
});
