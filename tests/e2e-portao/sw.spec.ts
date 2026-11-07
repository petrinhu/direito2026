import { expect, test } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp } from './apoio/acoes';
import { CONTA_ADMIN, ORIGEM } from './apoio/constantes';

test.beforeEach(() => resetarPrivado());

/**
 * Matador do service worker antigo (plano 2.1). O endereço /sw.js fica público e sem login: é o
 * que um aparelho parado busca ao voltar. O teste prova o TEXTO do matador e que o app novo não
 * registra service worker nenhum. O comportamento de desinstalar o SW antigo em navegador real
 * foi medido na F0.5 (onda0.md) e não é repetido aqui.
 */
test('/sw.js é o matador: público, sem register, e sem entrada de service worker no app', async ({
  page,
  request
}) => {
  const sw = await request.get(`${ORIGEM}/sw.js`);
  expect(sw.status()).toBe(200);
  const codigo = await sw.text();
  expect(codigo).toContain('unregister()');
  expect(codigo).not.toMatch(/\.register\(/);

  await entrarNoApp(page, CONTA_ADMIN, '/');
  const registros = await page.evaluate(
    async () => (await navigator.serviceWorker.getRegistrations()).length
  );
  expect(registros).toBe(0);
  const caches = await page.evaluate(async () => (await window.caches.keys()).length);
  expect(caches).toBe(0);
});
