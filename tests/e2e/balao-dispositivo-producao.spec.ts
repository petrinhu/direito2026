import { test, expect } from '@playwright/test';

/**
 * Prioridade zero (achado do líder, medido em produção): o balão de
 * citação legal não abria e o apêndice de dispositivos citados nunca
 * aparecia na impressão, porque o carregamento dos dados usava um
 * import() dinâmico com caminho montado em tempo de execução e
 * @vite-ignore - o empacotador nunca gerava pedaço nenhum para esses
 * dados, e o catch silencioso escondia o erro. Corrigido com um registro
 * estático (src/app/carregamento/carregadoresDispositivos.ts), mesmo
 * padrão já usado para o conteúdo da unidade.
 *
 * Este teste roda contra o PACOTE CONSTRUÍDO E SERVIDO (vite preview,
 * igual ao resto de tests/e2e/), nunca contra `vite dev`: é exatamente o
 * ambiente onde o defeito original só aparecia.
 */
test('acionar uma citação no resumo abre o balão com o texto real do artigo', async ({ page }) => {
  await page.goto('/p/p1/intr-direito/u1');

  const erroConsole: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') erroConsole.push(msg.text());
  });

  const botaoCitacao = page.locator('button[data-dispositivo="cpc-319"]').first();
  await botaoCitacao.waitFor({ state: 'visible' });
  await botaoCitacao.click();

  const balao = page.locator('#balao-dispositivo');
  await expect(balao).toBeVisible();
  // Nunca o estado de "não disponível" (era o único caminho possível
  // antes desta correção).
  await expect(balao).not.toContainText('não disponível');
  // Palavras reais do art. 319 do CPC (requisitos da petição inicial),
  // não um placeholder nem texto vazio.
  await expect(balao.locator('.balao-dispositivo__redacao')).toContainText(/juiz|petição/i);

  expect(erroConsole, `erros no console: ${erroConsole.join(' | ')}`).toEqual([]);
});

test('a impressão traz o apêndice de dispositivos citados, com o texto real', async ({ page }) => {
  await page.goto('/p/p1/intr-direito/u1');
  // O apêndice existe sempre no DOM (escondido em @media screen, seção
  // 12.6), então nem precisa emular impressão para conferir que os dados
  // chegaram - só que a seção deixe de estar vazia/ausente.
  const apendice = page.locator('.apendice-dispositivos');
  await expect(apendice).toBeAttached();
  const itens = apendice.locator('li');
  await expect(itens.first()).toBeAttached();
  expect(await itens.count()).toBeGreaterThan(0);
  await expect(apendice).toContainText(/juiz|petição|Código/i);
});
