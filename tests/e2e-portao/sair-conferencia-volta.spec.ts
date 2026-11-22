import { test } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp, esperarEntrada } from './apoio/acoes';
import { CONTA_ADMIN, DESTINO_INTERDISCIPLINAR } from './apoio/constantes';

/**
 * SU-F2b-GEMEOS (adendo 13.4 do CTO): a conferência de volta não pode recarregar a página no meio
 * de um Sair. A ordem dos eventos é controlada à mão, sem esperar tempo:
 *  1. a conferência de volta (/api/sessao.php) fica em voo antes do Sair;
 *  2. o Sair (/api/sair.php) termina e a troca para `/` começa, segurada no pedido do documento;
 *  3. só então a conferência responde "sem sessão".
 * Antes do conserto, esse recarregar cancela a troca para `/` e a tela de entrada fica no endereço do
 * destino. Depois, a conferência é ignorada e a entrada aparece na raiz.
 */
test.beforeEach(() => resetarPrivado());

test('Sair com a conferência de volta em voo: a entrada fica na raiz, não no endereço do destino', async ({
  page
}) => {
  await entrarNoApp(page, CONTA_ADMIN, DESTINO_INTERDISCIPLINAR);

  let responderConferencia: () => void = () => undefined;
  const conferenciaLiberada = new Promise<void>((resolver) => {
    responderConferencia = resolver;
  });
  let marcarConferenciaRespondida: () => void = () => undefined;
  const conferenciaRespondida = new Promise<void>((resolver) => {
    marcarConferenciaRespondida = resolver;
  });
  await page.route(
    '**/api/sessao.php',
    async (rota) => {
      await conferenciaLiberada;
      await rota.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, autenticado: false })
      });
      marcarConferenciaRespondida();
    },
    { times: 1 }
  );

  let chegouNaRaiz: () => void = () => undefined;
  const raizChegou = new Promise<void>((resolver) => {
    chegouNaRaiz = resolver;
  });
  let liberarRaiz: () => void = () => undefined;
  const raizLiberada = new Promise<void>((resolver) => {
    liberarRaiz = resolver;
  });
  await page.route(
    (url) => url.pathname === '/',
    async (rota) => {
      chegouNaRaiz();
      await raizLiberada;
      await rota.continue().catch(() => undefined);
    },
    { times: 1 }
  );

  // 1. Conferência em voo antes do Sair: a aba "voltou" enquanto a pessoa clica em Sair.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  // 2. O Sair segue o seu curso; a troca para `/` fica segurada no pedido do documento.
  await page.getByRole('button', { name: 'Sair' }).click();
  await raizChegou;
  // 3. Só agora a conferência responde "sem sessão".
  responderConferencia();
  await conferenciaRespondida;

  liberarRaiz();
  await page.waitForURL((url) => url.pathname === '/');
  await esperarEntrada(page);
});
