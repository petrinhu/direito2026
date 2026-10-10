import { expect, test } from '@playwright/test';
import { abrirAbaSlides, prepararAreaRestritaFalsa } from './apoio/areaRestritaFalsa';

// Escrito, não executado nesta máquina (L-50): roda no CI/ambiente isolado.
// Sessão e conteúdo são interceptados (apoio/areaRestritaFalsa): sem conta real.
test.describe('Slides: aviso de celular em pé', () => {
  test('em pé e estreito mostra o aviso; deitado mostra o palco', async ({ page }) => {
    await prepararAreaRestritaFalsa(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/p/p1/interdisciplinar');
    await abrirAbaSlides(page);
    const aviso = page.getByText('Gire o aparelho para ver os slides');
    await expect(aviso).toBeVisible();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(aviso).toBeHidden();
  });
});
