import { expect, test } from '@playwright/test';

/**
 * Kelsen Jump no site construído (vite preview): a rota abre, o espaço começa a partida, a partida
 * termina com uma colisão e o recorde fica guardado no navegador, inclusive depois de recarregar.
 * Roda só com o build feito antes, na fila pesada.
 */
test('Kelsen Jump: a rota abre, a legenda aparece e o espaço inicia o jogo', async ({ page }) => {
  await page.goto('/kelsen-jump');
  await expect(page.getByRole('heading', { level: 1, name: 'Kelsen Jump' })).toBeVisible();

  const tela = page.getByRole('img', { name: /Kelsen Jump/ });
  await expect(tela).toBeVisible();
  await expect(page.getByText('NHF - Norma Hipotética Fundamental', { exact: true })).toBeVisible();
  await tela.focus();
  await expect(tela).toBeFocused();

  await page.keyboard.press('Space');
  await expect(page.locator('[data-licao]')).toBeVisible({ timeout: 30000 });
});

test('Kelsen Jump: perder registra o recorde, que se mantém depois de recarregar', async ({
  page
}) => {
  await page.goto('/kelsen-jump');
  const tela = page.getByRole('img', { name: /Kelsen Jump/ });
  await tela.focus();
  await page.keyboard.press('Space');

  // Sem pular nem abaixar, a primeira nuvem do grupo bate no Kelsen e a partida termina.
  await expect(page.locator('[data-licao]')).toBeVisible({ timeout: 30000 });
  const leitor = page.locator('[data-recorde-leitor]');
  await expect(leitor).toContainText('Pontuação final');
  const textoFim = (await leitor.textContent()) ?? '';
  const pontuacaoFinal = Number(/Pontuação final (\d+)/.exec(textoFim)?.[1]);
  const recorde = Number(/Recorde: (\d+)/.exec(textoFim)?.[1]);
  expect(pontuacaoFinal).toBeGreaterThan(0);
  expect(recorde).toBe(pontuacaoFinal);
  await expect(page.getByText('Novo recorde!', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.locator('[data-recorde-leitor]')).toHaveText(`Recorde: ${recorde}.`);
});

test('Kelsen Jump: o botão de som tem nome acessível e alterna entre ligado e mudo', async ({
  page
}) => {
  await page.goto('/kelsen-jump');
  const somLigado = page.getByRole('button', { name: 'Desligar o som' });
  await expect(somLigado).toBeVisible();
  await expect(somLigado).not.toHaveAttribute('aria-pressed');

  await somLigado.click();
  const somMudo = page.getByRole('button', { name: 'Ligar o som' });
  await expect(somMudo).not.toHaveAttribute('aria-pressed');
  await expect(somMudo).toHaveClass(/kj__mudo--mudo/);
  await expect(page.getByRole('button', { name: 'Desligar o som' })).toHaveCount(0);
});

/**
 * Teclado sem clique no jogo (defeito 1.18.35.0): o foco fica no corpo da página, não no canvas. O
 * Espaço e a seta precisam agir no Kelsen e não rolar a página; no botão de som, o Espaço é do botão.
 */
test.describe('teclado sem clicar no jogo', () => {
  test.use({ viewport: { width: 800, height: 500 } });

  test('Espaço pula sem clicar no canvas, e a página não rola', async ({ page }) => {
    await page.goto('/kelsen-jump');
    const tela = page.getByRole('img', { name: /Kelsen Jump/ });
    await expect(tela).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)
    ).toBe(true);

    await page.keyboard.press('Space');
    await expect(tela).toHaveAttribute('data-pose', 'pulando');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('Seta para baixo abaixa sem clicar no canvas, e a página não rola', async ({ page }) => {
    await page.goto('/kelsen-jump');
    const tela = page.getByRole('img', { name: /Kelsen Jump/ });
    await expect(tela).toBeVisible();
    await page.keyboard.press('Space');
    await expect(tela).toHaveAttribute('data-pose', 'correndo');

    await page.keyboard.down('ArrowDown');
    await expect(tela).toHaveAttribute('data-pose', 'abaixado');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.keyboard.up('ArrowDown');
    await expect(tela).toHaveAttribute('data-pose', 'correndo');
  });

  test('Espaço com o foco no botão de som alterna o som e não faz o Kelsen pular', async ({
    page
  }) => {
    await page.goto('/kelsen-jump');
    const tela = page.getByRole('img', { name: /Kelsen Jump/ });
    const somLigado = page.getByRole('button', { name: 'Desligar o som' });
    await somLigado.focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Ligar o som' })).toBeVisible();
    await expect(tela).toHaveAttribute('data-pose', 'parado');
  });
});
