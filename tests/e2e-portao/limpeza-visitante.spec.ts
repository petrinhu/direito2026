import { expect, test, type Page } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp, esperarEntrada } from './apoio/acoes';
import { CONTA_ADMIN } from './apoio/constantes';

test.beforeEach(() => resetarPrivado());

/** Cabeçalho Clear-Site-Data da resposta da navegação para "/" (o documento, não os recursos). */
async function cabecalhoDaNavegacao(page: Page): Promise<string | null> {
  const resposta = page.waitForResponse(
    (r) => r.request().isNavigationRequest() && new URL(r.url()).pathname === '/'
  );
  await page.goto('/');
  return (await resposta).headers()['clear-site-data'] ?? null;
}

test('visitante sem sessão recebe a limpeza de cache e storage, nunca cookies', async ({
  page
}) => {
  const cabecalho = await cabecalhoDaNavegacao(page);
  await esperarEntrada(page);
  expect(cabecalho).toBe('"cache", "storage"');
  expect(cabecalho).not.toContain('cookies');
  expect(cabecalho).not.toContain('*');
});

test('quem entrou não recebe a limpeza na navegação para "/"', async ({ page }) => {
  await entrarNoApp(page, CONTA_ADMIN, '/');
  const cabecalho = await cabecalhoDaNavegacao(page);
  expect(cabecalho).toBeNull();
});
