import { expect, test } from '@playwright/test';

// Escrito, não executado nesta máquina (L-50): roda no CI/ambiente isolado.
// Exige a área restrita servida com o conteúdo de teste; ajustar o apoio conforme os outros e2e da área.
test.describe('Slides: aviso de celular em pé', () => {
  test('em pé e estreito mostra o aviso; deitado mostra o palco', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/p/p1/interdisciplinar');
    const aviso = page.getByText('Gire o aparelho para ver os slides');
    await expect(aviso).toBeVisible();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(aviso).toBeHidden();
  });
});
