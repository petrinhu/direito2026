import { expect, test } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp, esperarApp, esperarEntrada, preencherEntrada } from './apoio/acoes';
import { CONTA_ADMIN, DESTINO_INTERDISCIPLINAR, ORIGEM, ORIGEM_EXTERNA } from './apoio/constantes';

test.beforeEach(() => resetarPrivado());

/**
 * Página de outro site (127.0.0.1, não localhost) com um link para o Interdisciplinar. Servida
 * pelo próprio teste (route), sem segundo servidor. Clique de outro site não leva o cookie
 * SameSite=Strict (decisão do líder, plano 7.4: "link externo sem novo login").
 */
async function abrirPaginaExterna(page: import('@playwright/test').Page): Promise<void> {
  await page.route(`${ORIGEM_EXTERNA}/pagina-externa.html`, (rota) =>
    rota.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body:
        `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>Página externa sintética</title></head>` +
        `<body><a id="link-externo" href="${ORIGEM}${DESTINO_INTERDISCIPLINAR}">Ir ao Interdisciplinar</a></body></html>`
    })
  );
  await page.goto(`${ORIGEM_EXTERNA}/pagina-externa.html`);
}

test('link externo com sessão válida cai na entrada e, depois do login, chega ao destino', async ({
  page
}) => {
  await entrarNoApp(page, CONTA_ADMIN, '/');
  const cookieSessao = (await page.context().cookies(ORIGEM)).find((c) => c.name === '__Host-d26');
  expect(cookieSessao?.sameSite).toBe('Strict');

  await abrirPaginaExterna(page);
  await page.locator('#link-externo').click();

  await esperarEntrada(page);
  expect(new URL(page.url()).pathname).toBe(DESTINO_INTERDISCIPLINAR);

  await preencherEntrada(page, CONTA_ADMIN);
  await page.waitForURL(`**${DESTINO_INTERDISCIPLINAR}`);
  await esperarApp(page);
  expect(new URL(page.url()).pathname).toBe(DESTINO_INTERDISCIPLINAR);
});

test('digitar o endereço com sessão válida entra direto, sem tela de entrada', async ({ page }) => {
  await entrarNoApp(page, CONTA_ADMIN, '/');
  await page.goto(DESTINO_INTERDISCIPLINAR);
  await esperarApp(page);
  await expect(page.locator('#senha')).toHaveCount(0);
});
