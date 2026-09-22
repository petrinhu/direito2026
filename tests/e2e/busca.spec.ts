import { test, expect } from '@playwright/test';

/**
 * Prova, contra o build real servido por `vite preview`, que o índice de
 * busca carrega do novo caminho (assets/busca-indice.json, achado do
 * líder 22/09/2026: o antigo public/busca/ colidia com a rota /busca) e
 * que uma consulta sem acento acha o termo acentuado (seção 7 e 14).
 */
test('buscar sem acento encontra o termo acentuado', async ({ page }) => {
  const respostasComFalha: number[] = [];
  page.on('response', (resposta) => {
    if (resposta.url().includes('busca-indice.json')) respostasComFalha.push(resposta.status());
  });

  await page.goto('/busca');
  const campo = page.getByRole('searchbox', { name: 'Buscar no conteúdo' });
  await campo.click();
  await campo.fill('peticao');
  await page.waitForTimeout(200);

  expect(respostasComFalha).toEqual([200]);
  await expect(page.locator('.painel-resultados-busca')).toContainText(/petição/i);
});
