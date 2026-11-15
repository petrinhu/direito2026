import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

/**
 * HIST-F4: páginas Novidades e Changelog no site construído (vite preview). A versão esperada vem do
 * package.json do próprio repositório, nunca de um número escrito aqui. O QA roda este arquivo na fila
 * pesada (a árvore viva não roda e2e).
 */
// ESM (package.json "type": "module"): o caminho sai de import.meta.url.
const VERSAO_DO_PACOTE = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf-8')
).version as string;

test('Novidades mostra o título e a versão do pacote, com o texto didático em lista', async ({
  page
}) => {
  await page.goto('/novidades');
  // Convenção do site: o roteador leva o foco a #conteudo-principal depois da troca de página.
  await expect(page.locator('#conteudo-principal')).toBeFocused();
  await expect(page.getByRole('heading', { level: 1, name: 'Novidades' })).toBeVisible();
  // No estado A (histórico gravado antes do release) o topo é a seguinte: a versão do pacote tem de existir na lista.
  await expect(
    page.getByRole('heading', { level: 2 }).filter({ hasText: VERSAO_DO_PACOTE })
  ).toBeVisible();
  await expect(page.locator('section').first().getByRole('listitem').first()).toBeVisible();
});

test('Changelog mostra o registro técnico da versão do pacote', async ({ page }) => {
  await page.goto('/changelog');
  await expect(page.locator('#conteudo-principal')).toBeFocused();
  await expect(page.getByRole('heading', { level: 1, name: 'Changelog' })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2 }).filter({ hasText: VERSAO_DO_PACOTE })
  ).toBeVisible();
});

test('o menu lateral leva às duas páginas, depois do Calendário', async ({ page }) => {
  await page.goto('/p/p1/intr-direito/u1');
  const topo = page.locator('.menu-curriculo__topo');
  await expect(topo.getByRole('link', { name: 'Novidades' })).toBeVisible();
  await topo.getByRole('link', { name: 'Novidades' }).click();
  await expect(page).toHaveURL(/\/novidades$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Novidades' })).toBeVisible();
});
