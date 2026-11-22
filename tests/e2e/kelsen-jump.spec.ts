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
  await expect(page.getByText('NHF - Norma Hipotética Fundamental', { exact: true })).toBeVisible();
  await tela.focus();
  await expect(tela).toBeFocused();

  await page.keyboard.press('Space');

  const placar = page.locator('[data-pontuacao]');
  await expect(placar).toBeVisible();
  await expect
    .poll(async () => Number(await placar.textContent()), { timeout: 1500 })
    .toBeGreaterThan(0);
});

test('Kelsen Jump: o botão de som tem nome acessível e alterna entre ligado e mudo', async ({
  page
}) => {
  await page.goto('/kelsen-jump');
  const somLigado = page.getByRole('button', { name: 'Desligar o som' });
  await expect(somLigado).toBeVisible();
  await expect(somLigado).toHaveAttribute('aria-pressed', 'false');

  await somLigado.click();
  const somMudo = page.getByRole('button', { name: 'Ligar o som' });
  await expect(somMudo).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Desligar o som' })).toHaveCount(0);
});
