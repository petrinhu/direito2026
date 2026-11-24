import { expect, test, type Page } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp, esperarEntrada } from './apoio/acoes';
import { CONTA_ADMIN } from './apoio/constantes';

test.beforeEach(() => resetarPrivado());

/**
 * Cabeçalho Clear-Site-Data que o servidor manda para a navegação de "/", pelo request do próprio contexto
 * (mesmos cookies do navegador). Provavelmente o Chrome consome Clear-Site-Data antes do renderer, então a resposta da
 * navegação no navegador não o expõe ao Playwright; por isso a checagem é pelo request.
 */
async function cabecalhoDaNavegacao(page: Page): Promise<string | null> {
  const resposta = await page.request.get('/', {
    headers: { 'Sec-Fetch-Mode': 'navigate', Accept: 'text/html' }
  });
  return resposta.headers()['clear-site-data'] ?? null;
}

test('visitante sem sessão recebe a limpeza de cache e storage, nunca cookies', async ({
  page
}) => {
  await esperarEntrada(page);
  const cabecalho = await cabecalhoDaNavegacao(page);
  expect(cabecalho).toBe('"cache", "storage"');
  expect(cabecalho).not.toContain('cookies');
  expect(cabecalho).not.toContain('*');
});

test('quem entrou não recebe a limpeza na navegação para "/"', async ({ page }) => {
  await entrarNoApp(page, CONTA_ADMIN, '/');
  const cabecalho = await cabecalhoDaNavegacao(page);
  expect(cabecalho).toBeNull();
});
