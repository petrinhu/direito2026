import { test, expect } from '@playwright/test';

/**
 * Critério 3 da especificação (docs/modo-adaptado.md, seção 8; WCAG 1.4.12
 * Espaçamento de texto): com o modo adaptado ligado, sobrepor via CSS os
 * valores MÍNIMOS do critério por cima dos valores já maiores do modo, e
 * confirmar que nenhum texto de dois parágrafos vizinhos se sobrepõe.
 */
async function ligarModoAdaptado(page: import('@playwright/test').Page, caminho: string) {
  await page.addInitScript(() => {
    localStorage.setItem('caderno-direito:v1:modo-adaptado', 'true');
  });
  await page.goto(caminho);
}

test('espaçamento de texto forçado (WCAG 1.4.12) não sobrepõe parágrafos vizinhos', async ({
  page
}) => {
  await ligarModoAdaptado(page, '/p/p1/intr-direito/u1');
  await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });

  await page.addStyleTag({
    content: `
      * {
        line-height: 1.5 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }
      p {
        margin-block-end: 2em !important;
      }
    `
  });

  const paragrafos = page.locator('main p');
  const total = await paragrafos.count();
  expect(total).toBeGreaterThan(1);

  const retangulos: { top: number; bottom: number; left: number; right: number }[] = [];
  for (let i = 0; i < total; i++) {
    const caixa = await paragrafos.nth(i).boundingBox();
    if (caixa) {
      retangulos.push({
        top: caixa.y,
        bottom: caixa.y + caixa.height,
        left: caixa.x,
        right: caixa.x + caixa.width
      });
    }
  }

  for (let i = 0; i < retangulos.length - 1; i++) {
    const a = retangulos[i]!;
    const b = retangulos[i + 1]!;
    const sobrepoeVerticalmente = a.bottom > b.top && a.top < b.bottom;
    const sobrepoeHorizontalmente = a.left < b.right && a.right > b.left;
    expect(
      sobrepoeVerticalmente && sobrepoeHorizontalmente,
      `parágrafo ${i} sobrepõe ${i + 1}`
    ).toBe(false);
  }
});
