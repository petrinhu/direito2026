import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * QUADRO-PROVA-TEXTO-360 (decisão do líder, 21/11/2026: "Abrir minimizado no celular"). Abaixo de 480 px
 * de janela, o cartão "Faltam N dias" nasce minimizado. Se a pessoa abrir, a escolha dela é lembrada,
 * e o padrão nunca a sobrescreve. A página é /sobre, não o calendário, que já nasce minimizado.
 */
const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const PAGINA = '/sobre';
const CARTAO = 'aside.quadro-prova';
const BOTAO = `${CARTAO} .quadro-prova__alternar`;

async function abrirNaLargura(page: Page, largura: number): Promise<void> {
  await page.setViewportSize({ width: largura, height: 700 });
  await page.goto(PAGINA);
  await page.locator('main h1').first().waitFor({ state: 'visible' });
  await esperarLayoutAssentar(page);
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(DATA_FIXA));
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
});

test('390px, sem escolha gravada: o cartão nasce minimizado', async ({ page }) => {
  await abrirNaLargura(page, 390);
  await expect(page.locator(CARTAO)).toHaveClass(/quadro-prova--minimizado/);
  await expect(page.locator(BOTAO)).toHaveAttribute('aria-expanded', 'false');
});

test('479px minimizado, 480px aberto (limite de 480 px, estrito)', async ({ page }) => {
  await abrirNaLargura(page, 479);
  await expect(page.locator(CARTAO)).toHaveClass(/quadro-prova--minimizado/);
  await abrirNaLargura(page, 480);
  await expect(page.locator(CARTAO)).not.toHaveClass(/quadro-prova--minimizado/);
});

test('390px: Mostrar é lembrado depois de recarregar, e o padrão não o desfaz', async ({
  page
}) => {
  await abrirNaLargura(page, 390);
  await expect(page.locator(CARTAO)).toHaveClass(/quadro-prova--minimizado/);
  await page.locator(BOTAO).click();
  await expect(page.locator(CARTAO)).not.toHaveClass(/quadro-prova--minimizado/);
  await page.reload();
  await esperarLayoutAssentar(page);
  await expect(page.locator(CARTAO)).not.toHaveClass(/quadro-prova--minimizado/);
});

test('390px: Minimizar gravado continua minimizado depois de recarregar', async ({ page }) => {
  await abrirNaLargura(page, 390);
  await page.locator(BOTAO).click();
  await expect(page.locator(CARTAO)).not.toHaveClass(/quadro-prova--minimizado/);
  await page.locator(BOTAO).click();
  await expect(page.locator(CARTAO)).toHaveClass(/quadro-prova--minimizado/);
  await page.reload();
  await esperarLayoutAssentar(page);
  await expect(page.locator(CARTAO)).toHaveClass(/quadro-prova--minimizado/);
});
