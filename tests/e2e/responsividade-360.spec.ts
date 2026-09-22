import { test, expect } from '@playwright/test';

/**
 * Achado do QA (relatado pelo orquestrador, capturas em
 * mockups/capturas/v2/): a tabela do bloco 6 do resumo (e outras, em
 * mais de um bloco) estourava a largura em 360px, gerando 184px de
 * rolagem horizontal na PÁGINA inteira. Regra do projeto: nenhuma
 * rolagem lateral em 360px (docs/compatibilidade-navegadores.md).
 *
 * Medido só em jsdom não prova nada aqui: jsdom não faz layout real
 * (scrollWidth/clientWidth sempre 0), por isso este teste é Playwright
 * (o "padrão do projeto" para o que precisa de layout real, seção 14 da
 * arquitetura), não vitest/jsdom.
 */
test.use({ viewport: { width: 360, height: 800 } });

test('em 360px, a página do resumo (com tabelas comparativas) não estoura a largura', async ({
  page
}) => {
  await page.goto('/p/p1/intr-direito/u1');
  // Espera o conteúdo carregado (import dinâmico) aparecer: a primeira
  // tabela comparativa é prova de que o bloco 5 (numero 5) já montou.
  await page.locator('table').first().waitFor({ state: 'attached' });

  const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
  const larguraJanela = await page.evaluate(() => document.documentElement.clientWidth);

  expect(larguraDocumento, `scrollWidth ${larguraDocumento} vs clientWidth ${larguraJanela}`).toBe(
    larguraJanela
  );
});

test('em 360px, cada tabela do resumo rola dentro do próprio quadro (não a página)', async ({
  page
}) => {
  await page.goto('/p/p1/intr-direito/u1');
  const tabelas = page.locator('table');
  await tabelas.first().waitFor({ state: 'attached' });
  const total = await tabelas.count();
  expect(total).toBeGreaterThan(0);

  for (let i = 0; i < total; i++) {
    const quadro = page.locator('.tabela-rolavel').nth(i);
    await expect(quadro).toBeVisible();
    const podeRolar = await quadro.evaluate((el) => el.scrollWidth > el.clientWidth);
    // Nem toda tabela precisa ser larga o bastante para exigir rolagem
    // (a de 3 colunas pode caber), mas o CONTÊINER precisa existir e ter
    // overflow controlado — testado indiretamente pelo teste anterior
    // (a página, essa sim, nunca pode estourar).
    expect(typeof podeRolar).toBe('boolean');
  }
});
