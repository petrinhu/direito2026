import { expect, test } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { esperarEntrada, entrarNoApp } from './apoio/acoes';
import {
  CONTA_ADMIN,
  DESTINO_INTERDISCIPLINAR,
  ORIGEM,
  TRECHO_CONTEUDO_INTERDISCIPLINAR
} from './apoio/constantes';

test.beforeEach(() => resetarPrivado());

test('Sair devolve à tela de entrada e o servidor recusa o cookie antigo', async ({
  page,
  request
}) => {
  await entrarNoApp(page, CONTA_ADMIN, DESTINO_INTERDISCIPLINAR);
  const antigo = (await page.context().cookies(ORIGEM)).find((c) => c.name === '__Host-d26');
  expect(antigo, 'cookie de sessão antes de sair').toBeDefined();

  await page.getByRole('button', { name: 'Sair' }).click();
  await esperarEntrada(page);

  await page.goto(DESTINO_INTERDISCIPLINAR);
  await esperarEntrada(page);

  // O mesmo cookie, reenviado por fora do navegador, já não serve: a prova é do servidor.
  const reenvio = await request.get(`${ORIGEM}/api/conteudo.php`, {
    headers: { Cookie: `__Host-d26=${antigo?.value ?? ''}` }
  });
  expect(reenvio.status()).toBe(401);
  expect(await reenvio.text()).not.toContain(TRECHO_CONTEUDO_INTERDISCIPLINAR);
});

/**
 * Sinal invertido (plano 7.4, D2 "Desligar"): sem rede, nada de conteúdo abre. Não há cache de
 * service worker nem de navegador que sirva o app depois que a rede cai.
 */
test('sem rede, nada de conteúdo abre, mesmo depois de uma visita com sessão', async ({
  page,
  context
}) => {
  await entrarNoApp(page, CONTA_ADMIN, DESTINO_INTERDISCIPLINAR);
  await expect(
    page.getByText(TRECHO_CONTEUDO_INTERDISCIPLINAR, { exact: false }).first()
  ).toBeVisible();

  await context.setOffline(true);
  await page.goto('/calendario').catch(() => undefined);
  await page.reload().catch(() => undefined);

  await expect(page.locator('#app')).toHaveCount(0);
  await expect(page.getByText(TRECHO_CONTEUDO_INTERDISCIPLINAR, { exact: false })).toHaveCount(0);
  await context.setOffline(false);
});
