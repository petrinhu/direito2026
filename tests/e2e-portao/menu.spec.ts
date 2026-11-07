import { expect, test } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp } from './apoio/acoes';
import { CONTA_ADMIN, CONTA_COMUM } from './apoio/constantes';

test.beforeEach(() => resetarPrivado());

test('administrador vê Gerenciar usuários, Trocar senha e Sair no menu', async ({ page }) => {
  await entrarNoApp(page, CONTA_ADMIN, '/');
  await expect(page.getByRole('link', { name: 'Gerenciar usuários' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Trocar senha' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
});

test('usuário comum vê Trocar senha e Sair, e não vê Gerenciar usuários', async ({ page }) => {
  await entrarNoApp(page, CONTA_COMUM, '/');
  await expect(page.getByRole('link', { name: 'Trocar senha' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gerenciar usuários' })).toHaveCount(0);
});
