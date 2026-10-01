import { expect, test } from '@playwright/test';
import { prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * Abas Mapa mental, Fichamento e Mnemônicos de Filosofia Jurídica (ordem do
 * líder, 01/10/2026): rotas diretas, ordem das abas, teclado no mapa,
 * filtro do fichamento, resposta que se revela nos mnemônicos e impressão.
 * Layout, foco e impressão reais exigem navegador, por isso Playwright.
 */
const BASE = '/p/p1/filosofia-juridica/u1';

test.beforeEach(async ({ page }) => {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
});

test('as abas aparecem na ordem Resumo, Mapa mental, Fichamento, Mnemônicos, Quiz', async ({
  page
}) => {
  await page.goto(BASE);
  await expect(page.getByRole('tab')).toHaveText([
    'Resumo',
    'Mapa mental',
    'Fichamento',
    'Mnemônicos',
    'Quiz'
  ]);
});

for (const [rota, rotulo, seletor] of [
  ['mapa', 'Mapa mental', '[role="tree"]'],
  ['fichamento', 'Fichamento', '.fichamento'],
  ['mnemonicos', 'Mnemônicos', '.mnemonicos']
] as const) {
  test(`o endereço direto /${rota} abre a aba ${rotulo} com o conteúdo`, async ({ page }) => {
    await page.goto(`${BASE}/${rota}`);
    await expect(page.getByRole('tab', { selected: true })).toHaveText(rotulo);
    await expect(page.locator(`#painel-${rota} ${seletor}`)).toBeVisible();
  });
}

test('o menu lateral leva às abas novas', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.locator(`a[href="${BASE}/mapa"]`)).toHaveCount(1);
  await expect(page.locator(`a[href="${BASE}/fichamento"]`)).toHaveCount(1);
  await expect(page.locator(`a[href="${BASE}/mnemonicos"]`)).toHaveCount(1);
});

test('mapa: teclado completo (setas, Enter, Espaço, Home e End)', async ({ page }) => {
  await page.goto(`${BASE}/mapa`);
  const raiz = page.locator('#mapa-raiz');
  await raiz.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#mapa-era-antiga')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#mapa-fase-grecia-classica')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const sofocles = page.locator('#mapa-pensador-sofocles');
  await expect(sofocles).toBeFocused();
  await expect(sofocles).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await expect(sofocles).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Space');
  await expect(sofocles).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('ArrowRight');
  await expect(sofocles).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#mapa-sofocles-modo')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(sofocles).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator('[role="treeitem"]:focus')).toHaveCount(1);
  await page.keyboard.press('Home');
  await expect(raiz).toBeFocused();
});

test('mapa: um só item no ciclo de Tab e o foco tem contorno visível', async ({ page }) => {
  await page.goto(`${BASE}/mapa`);
  await expect(page.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
  await page.locator('#mapa-era-antiga').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const contorno = await page
    .locator('#mapa-era-antiga')
    .evaluate((el) => getComputedStyle(el.querySelector('.no-mapa__corpo')!).outlineStyle);
  expect(contorno).not.toBe('none');
});

test('mapa: abrir todos os ramos e fechar até as fases', async ({ page }) => {
  await page.goto(`${BASE}/mapa`);
  await page.getByRole('button', { name: 'Abrir todos os ramos' }).click();
  await expect(page.locator('#mapa-pensador-platao')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#mapa-platao-modo')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar até as fases' }).click();
  await expect(page.locator('#mapa-platao-modo')).toBeHidden();
});

test('mapa: o atalho da ficha leva ao fichamento e abre a ficha', async ({ page }) => {
  await page.goto(`${BASE}/mapa`);
  await page.locator('#mapa-pensador-platao .no-mapa__corpo').first().click();
  await page.locator('#mapa-platao-ficha a').click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/fichamento#ficha-platao$`));
  await expect(page.locator('#ficha-platao button.ficha__botao')).toHaveAttribute(
    'aria-expanded',
    'true'
  );
});

test('fichamento: filtra por período, por termo e anuncia o total', async ({ page }) => {
  await page.goto(`${BASE}/fichamento`);
  await expect(page.locator('article.ficha')).toHaveCount(12);
  await page.getByLabel('Período ou fase').selectOption('era:media');
  await expect(page.locator('article.ficha')).toHaveCount(4);
  await expect(page.getByRole('status')).toHaveText('4 fichas');
  await page.getByLabel('Buscar nas fichas').fill('ockham');
  await expect(page.locator('article.ficha')).toHaveCount(1);
  await page.getByLabel('Buscar nas fichas').fill('zzzz');
  await expect(page.getByRole('status')).toHaveText('Nenhuma ficha encontrada');
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page.locator('article.ficha')).toHaveCount(12);
});

test('fichamento: a ficha abre pelo botão, por teclado, e mostra os campos', async ({ page }) => {
  await page.goto(`${BASE}/fichamento`);
  const botao = page.locator('#ficha-aristoteles button.ficha__botao');
  await botao.focus();
  await page.keyboard.press('Enter');
  await expect(botao).toHaveAttribute('aria-expanded', 'true');
  const corpo = page.locator('#ficha-aristoteles .ficha__corpo');
  for (const campo of ['Ideia central', 'Conceitos-chave', 'Citação', 'Referências']) {
    await expect(corpo).toContainText(campo);
  }
});

test('busca: uma ficha do fichamento aparece como resultado', async ({ page }) => {
  await page.goto('/busca');
  await page.getByRole('searchbox').fill('Ockham');
  await expect(page.locator(`a[href^="${BASE}/fichamento#ficha-ockham"]`).first()).toBeVisible();
});

test('mnemônicos: a resposta começa escondida e se revela pelo botão, por teclado', async ({
  page
}) => {
  await page.goto(`${BASE}/mnemonicos`);
  const botao = page.locator('#mnemonico-leis-de-tomas button.mnemonico__botao');
  await expect(page.locator('#mnemonico-leis-de-tomas .mnemonico__resposta')).toBeHidden();
  await botao.focus();
  await page.keyboard.press('Enter');
  await expect(botao).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#mnemonico-leis-de-tomas .mnemonico__resposta')).toBeVisible();
  await expect(page.locator('#mnemonico-leis-de-tomas .mnemonico__resposta')).toContainText(
    'Lei divina'
  );
});

test('impressão: o mapa sai com todos os ramos e as fichas e respostas abertas', async ({
  page
}) => {
  await page.goto(`${BASE}/mapa`);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#mapa-platao-modo')).toBeVisible();
  await page.goto(`${BASE}/fichamento`);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#ficha-platao .ficha__corpo')).toBeVisible();
  await page.goto(`${BASE}/mnemonicos`);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#mnemonico-leis-de-tomas .mnemonico__resposta')).toBeVisible();
});
