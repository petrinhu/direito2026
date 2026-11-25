import { expect, test } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { esperarApp, esperarEntrada, preencherEntrada } from './apoio/acoes';
import { CONTA_ADMIN } from './apoio/constantes';

test.beforeEach(() => resetarPrivado());

test('página aberta com token vencido: volta a tela com o aviso e o usuário digitado, e o envio seguinte entra', async ({
  page,
  context
}) => {
  await page.goto('/');
  await esperarEntrada(page);

  // Outra visita à tela troca o cookie pré; o formulário desta aba fica com um token que não casa.
  await context.clearCookies({ name: '__Host-d26pre' });
  const outra = await context.newPage();
  await outra.goto('/');
  await outra.close();

  await preencherEntrada(page, CONTA_ADMIN);
  await expect(page.getByRole('alert')).toHaveText('Sua página tinha expirado. Entre de novo.');
  await expect(page.locator('#usuario')).toHaveValue(CONTA_ADMIN.usuario);
  await expect(page.locator('#senha')).toHaveValue('');

  await preencherEntrada(page, CONTA_ADMIN);
  await esperarApp(page);
});
