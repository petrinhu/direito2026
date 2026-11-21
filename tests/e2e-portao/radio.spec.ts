import { expect, test } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp } from './apoio/acoes';
import { CONTA_ADMIN } from './apoio/constantes';

test.beforeEach(() => resetarPrivado());

/**
 * Hosts de stream das 5 rádios (CSP media-src). Qualquer pedido a eles é interceptado aqui: nenhum
 * stream real entra no teste (decisão do piso de testes). Com o consentimento não dado, nenhum
 * pedido pode sair.
 */
const HOSTS_DE_STREAM =
  /^https:\/\/[^/]*(srg-ssr\.ch|streamingpulse\.com|stereoscenic\.com|streamerr\.co|radionetz\.de)/;

test('tocador: aparece depois do login, o aviso de IP vem antes de conectar e Cancelar não conecta nada', async ({
  page
}) => {
  const pedidosAoStream: string[] = [];
  await page.route(HOSTS_DE_STREAM, (rota) => {
    pedidosAoStream.push(rota.request().url());
    return rota.abort();
  });

  await entrarNoApp(page, CONTA_ADMIN, '/');

  const tocar = page.getByRole('button', { name: 'Tocar', exact: true });
  await expect(tocar).toBeVisible();
  await expect(page.locator('audio')).not.toHaveAttribute('src', /.+/);

  await tocar.click();
  const aviso = page.getByRole('dialog', { name: 'Antes de conectar' });
  await expect(aviso).toBeVisible();
  await expect(aviso).toContainText('endereço IP do seu aparelho vai para essa emissora');

  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(aviso).toBeHidden();
  await expect(page.locator('audio')).not.toHaveAttribute('src', /.+/);
  await expect(page.getByRole('status').filter({ hasText: 'Rádio parada' })).toHaveCount(1);
  expect(pedidosAoStream).toEqual([]);
});
