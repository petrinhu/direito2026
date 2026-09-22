import { test, expect } from '@playwright/test';

// Seção 14 da arquitetura, "Ponta a ponta": deep link direto na unidade
// piloto carrega a página certa (prova o fallback de history mode), tema
// persiste, e a busca sem acento encontra o termo acentuado.

test('a home carrega e mostra o título do site', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Caderno de Direito/);
  await expect(page.locator('h1')).toContainText('Caderno de Direito');
});

test('deep link direto na aba de quiz da unidade piloto abre a página certa', async ({ page }) => {
  await page.goto('/p/p1/intr-direito/u1/quiz');
  await expect(page.getByRole('tab', { name: 'Quiz' })).toHaveAttribute('aria-selected', 'true');
});

test('trocar de tema persiste depois de recarregar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /tema/i }).click();
  const temaDepoisDoClique = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.reload();
  const temaDepoisDeRecarregar = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(temaDepoisDeRecarregar).toBe(temaDepoisDoClique);
});

test('menu de currículo abre por teclado e Escape fecha', async ({ page }) => {
  await page.goto('/');
  const botaoPeriodo = page.locator('nav[aria-label="Currículo"] button[aria-expanded]').first();
  await botaoPeriodo.focus();
  await page.keyboard.press('Enter');
  await expect(botaoPeriodo).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(botaoPeriodo).toHaveAttribute('aria-expanded', 'false');
});

test('nenhum erro no console ao navegar da home até o quiz', async ({ page }) => {
  const erros: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') erros.push(msg.text());
  });
  await page.goto('/');
  await page.goto('/p/p1/intr-direito/u1/quiz');
  expect(erros).toEqual([]);
});
