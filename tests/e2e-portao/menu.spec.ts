import { expect, test, type Locator } from '@playwright/test';
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

/**
 * Começo do conteúdo de um item: a borda esquerda da caixa mais padding e borda. Calendário
 * (ícone) e os itens do bloco da conta (texto) têm de começar na mesma coluna (QA F5.1, 8.6).
 */
async function inicioDoConteudo(alvo: Locator): Promise<number> {
  return alvo.evaluate((el) => {
    const estilo = getComputedStyle(el);
    return (
      el.getBoundingClientRect().left +
      parseFloat(estilo.paddingLeft) +
      parseFloat(estilo.borderLeftWidth)
    );
  });
}

test('os itens do bloco da conta começam na mesma coluna do Calendário, a 1280', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await entrarNoApp(page, CONTA_ADMIN, '/');
  const calendario = await inicioDoConteudo(page.locator('.menu-curriculo__calendario'));
  for (const alvo of [
    page.getByRole('link', { name: 'Gerenciar usuários' }),
    page.getByRole('link', { name: 'Trocar senha' }),
    page.getByRole('button', { name: 'Sair' })
  ]) {
    const inicio = await inicioDoConteudo(alvo);
    expect(Math.abs(inicio - calendario), 'recuo do item do bloco da conta').toBeLessThanOrEqual(1);
  }
});
