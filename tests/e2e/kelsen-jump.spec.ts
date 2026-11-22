import { expect, test } from '@playwright/test';

/**
 * Kelsen Jump no site construído (vite preview): a rota abre, o espaço dá o primeiro salto e a
 * pontuação começa a subir. Roda só com o build feito antes, na fila pesada.
 */
test('Kelsen Jump: a rota abre, o espaço inicia o jogo e a pontuação aparece', async ({ page }) => {
  await page.goto('/kelsen-jump');
  await expect(page.getByRole('heading', { level: 1, name: 'Kelsen Jump' })).toBeVisible();

  const tela = page.getByRole('img', { name: /Kelsen Jump/ });
  await expect(tela).toBeVisible();
  await tela.focus();
  await expect(tela).toBeFocused();

  await page.keyboard.press('Space');

  const placar = page.locator('[data-pontuacao]');
  await expect(placar).toBeVisible();
  await expect
    .poll(async () => Number(await placar.textContent()), { timeout: 1500 })
    .toBeGreaterThan(0);
});
