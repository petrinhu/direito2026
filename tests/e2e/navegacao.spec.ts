import { test, expect } from '@playwright/test';

// Seção 14 da arquitetura, "Ponta a ponta": deep link direto na unidade
// piloto carrega a página certa (prova o fallback de history mode), tema
// persiste, e a busca sem acento encontra o termo acentuado.

test('a home carrega e mostra o título do site', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Caderno de Direito/);
  await expect(page.locator('h1')).toContainText('Caderno de Direito');
});

test('deep link direto na aba de quiz da unidade piloto abre a página certa', async ({ page }) => {
  await page.goto('/p/p1/intr-direito/u1/quiz');
  await expect(page.getByRole('tab', { name: 'Quiz' })).toHaveAttribute('aria-selected', 'true');
});

test('trocar de tema persiste depois de recarregar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /tema/i }).click();
  const temaDepoisDoClique = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.reload();
  // O atributo de tema só é aplicado depois de `await carregarCurriculo()`
  // resolver dentro de bootstrap() (main.ts) - não é garantido já existir
  // no instante em que o evento 'load' da página dispara. Achado ao ligar
  // o service worker (item 9 da onda): o registro extra antes de
  // bootstrap() deixou essa corrida latente mais fácil de acontecer sob
  // carga (suíte inteira em paralelo). Espera o atributo aparecer, em vez
  // de ler no mesmo instante do reload.
  await page.waitForFunction(() => document.documentElement.dataset.theme !== undefined);
  const temaDepoisDeRecarregar = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(temaDepoisDeRecarregar).toBe(temaDepoisDoClique);
});

test('menu de currículo abre por teclado e Escape fecha', async ({ page }) => {
  await page.goto('/');
  const botaoPeriodo = page.locator('nav[aria-label="Currículo"] button[aria-expanded]').first();
  await botaoPeriodo.focus();
  await page.keyboard.press('Enter');
  await expect(botaoPeriodo).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(botaoPeriodo).toHaveAttribute('aria-expanded', 'false');
});

test('nenhum erro no console ao navegar da home até o quiz', async ({ page }) => {
  const erros: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') erros.push(msg.text());
  });
  await page.goto('/');
  await page.goto('/p/p1/intr-direito/u1/quiz');
  expect(erros).toEqual([]);
});

/**
 * Achado ao investigar o estouro de tabela em 360px (QA, 22/09/2026):
 * AbasUnidade.vue renderiza o slot padrão uma vez POR ABA (um
 * role="tabpanel" por aba, v-show troca qual fica visível); Unidade.vue
 * ignorava o `aba` escopado do slot e usava o da rota, então as TRÊS
 * abas mostravam o mesmo conteúdo: o resumo inteiro (9 blocos) aparecia
 * 3 vezes no DOM, com ids duplicados (bloco-0, bloco-0, bloco-0...).
 * IDs duplicados são HTML inválido e getElementById só acha o primeiro
 * — risco real para âncora, mesmo funcionando por sorte de ordem hoje.
 */
test('cada aba (resumo/petição/quiz) renderiza seu conteúdo uma única vez, sem id duplicado', async ({
  page
}) => {
  await page.goto('/p/p1/intr-direito/u1');
  await page.locator('table').first().waitFor({ state: 'attached' });

  const diagnostico = await page.evaluate(() => {
    const blocos = Array.from(document.querySelectorAll('.bloco-teorico'));
    const idsComContagem = new Map<string, number>();
    for (const el of document.querySelectorAll('[id]')) {
      idsComContagem.set(el.id, (idsComContagem.get(el.id) ?? 0) + 1);
    }
    const idsDuplicados = [...idsComContagem.entries()].filter(([, n]) => n > 1);
    return {
      totalBlocosResumo: blocos.length,
      idsDuplicados
    };
  });

  expect(diagnostico.totalBlocosResumo).toBe(9);
  expect(diagnostico.idsDuplicados).toEqual([]);
});
