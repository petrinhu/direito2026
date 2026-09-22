import { test, expect } from '@playwright/test';

/**
 * Ordem do líder, 22/09/2026, verbatim: "o balao está abrindo num local
 * fixo, não no ponto onde está o mouse. Logo, quando preciso rolar o
 * texto do balão, movo o mouse, ele some e não consigo ler o texto
 * inteiro. Faça o balao aparecer no local atual do cursor do mouse."
 *
 * Duas exigências: (1) posição junto do ponteiro, nunca um lugar fixo
 * nem só a âncora do botão; (2) o balão é "hoverable" (WCAG 2.1 SC
 * 1.4.13): o ponteiro atravessa da citação até o balão sem ele
 * desaparecer no caminho, e rolar dentro dele não fecha nada.
 *
 * Roda contra o PACOTE CONSTRUÍDO E SERVIDO (vite preview), igual ao
 * resto de tests/e2e/, porque é onde o CSS anchor positioning e o
 * contorno de @floating-ui/dom de fato disputam qual caminho é tomado.
 */

test('o balão abre perto do ponto do ponteiro, em duas posições diferentes dentro do MESMO botão', async ({
  page
}) => {
  // Prova mais rigorosa que "duas citações diferentes": duas citações já
  // abririam em posições diferentes mesmo âncorando no botão inteiro
  // (cada botão tem seu próprio retângulo). Para provar que é o PONTO do
  // ponteiro, e não o botão, que decide a posição, o teste hovera duas
  // vezes o MESMO botão, perto da borda esquerda e perto da borda
  // direita dele, e confere que o balão se desloca de acordo.
  await page.goto('/p/p1/intr-direito/u1/peticao');

  const balao = page.locator('#balao-dispositivo');
  // "art. 319, II, do CPC": rótulo longo o bastante para ter bordas
  // esquerda e direita a boa distância uma da outra.
  const botao = page.locator('button[data-dispositivo="cpc-319-ii"]').first();
  await botao.waitFor({ state: 'visible' });
  await botao.scrollIntoViewIfNeeded();
  const boxBotao = await botao.boundingBox();
  expect(boxBotao).not.toBeNull();
  expect(boxBotao!.width).toBeGreaterThan(60);

  const y = boxBotao!.y + boxBotao!.height / 2;
  const xEsquerda = boxBotao!.x + 4;
  const xDireita = boxBotao!.x + boxBotao!.width - 4;

  await page.mouse.move(xEsquerda, y);
  await expect(balao).toBeVisible();
  const boxBalaoEsquerda = await balao.boundingBox();
  expect(boxBalaoEsquerda).not.toBeNull();

  // Sai de verdade (fora do botão e do balão) para fechar antes de reabrir.
  await page.mouse.move(5, 5);
  await expect(balao).toBeHidden();

  await page.mouse.move(xDireita, y);
  await expect(balao).toBeVisible();
  const boxBalaoDireita = await balao.boundingBox();
  expect(boxBalaoDireita).not.toBeNull();

  // O balão se moveu para a direita acompanhando o ponteiro - não ficou
  // parado no mesmo lugar (que é o que aconteceria ao âncorar no botão
  // inteiro, com placement centralizado independente de onde dentro dele
  // o mouse estava).
  expect(boxBalaoDireita!.x).toBeGreaterThan(boxBalaoEsquerda!.x + 20);
});

test('perto da borda direita e do rodapé, o balão vira de lado e não ultrapassa a janela', async ({
  page
}) => {
  await page.goto('/p/p1/intr-direito/u1/peticao');

  // "art. 319, V, do CPC" é a última citação da petição, perto do fecho,
  // isto é, perto do rodapé do conteúdo.
  const botao = page.locator('button[data-dispositivo="cpc-319-v"]').first();
  await botao.scrollIntoViewIfNeeded();
  await botao.waitFor({ state: 'visible' });
  await botao.hover();

  const balao = page.locator('#balao-dispositivo');
  await expect(balao).toBeVisible();

  const boxBalao = await balao.boundingBox();
  const viewport = page.viewportSize();
  expect(boxBalao).not.toBeNull();
  expect(viewport).not.toBeNull();

  expect(boxBalao!.x).toBeGreaterThanOrEqual(0);
  expect(boxBalao!.y).toBeGreaterThanOrEqual(0);
  expect(boxBalao!.x + boxBalao!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(boxBalao!.y + boxBalao!.height).toBeLessThanOrEqual(viewport!.height + 1);
});

test('mover o ponteiro da citação até dentro do balão mantém aberto, e dá para rolar o conteúdo', async ({
  page
}) => {
  // Viewport baixo o bastante para garantir que a redação do art. 319 do
  // CPC (várias linhas/incisos) ultrapasse os 40vh do balão e precise de
  // rolagem interna. "cpc-319" (sem sufixo) só aparece na aba resumo,
  // a padrão da rota (mesma citação já usada em
  // balao-dispositivo-producao.spec.ts).
  await page.setViewportSize({ width: 1000, height: 500 });
  await page.goto('/p/p1/intr-direito/u1');

  const botao = page.locator('button[data-dispositivo="cpc-319"]').first();
  await botao.waitFor({ state: 'visible' });
  await botao.hover();

  const balao = page.locator('#balao-dispositivo');
  await expect(balao).toBeVisible();
  await expect(balao.locator('.balao-dispositivo__redacao')).toContainText(/juiz/i);

  const boxBotao = await botao.boundingBox();
  const boxBalao = await balao.boundingBox();
  expect(boxBotao).not.toBeNull();
  expect(boxBalao).not.toBeNull();

  // Caminha o ponteiro, em passos, do botão até o centro do balão -
  // exatamente o trajeto que fechava o balão antes da correção.
  const destinoX = boxBalao!.x + boxBalao!.width / 2;
  const destinoY = boxBalao!.y + boxBalao!.height / 2;
  await page.mouse.move(boxBotao!.x + boxBotao!.width / 2, boxBotao!.y + boxBotao!.height / 2);
  await page.mouse.move(destinoX, destinoY, { steps: 12 });

  // Ainda aberto: o ponteiro atravessou a citação até o balão.
  await expect(balao).toBeVisible();

  const alturaConteudo = await balao.evaluate((elemento) => elemento.scrollHeight);
  const alturaVisivel = await balao.evaluate((elemento) => elemento.clientHeight);
  expect(
    alturaConteudo,
    'o texto do art. 319 precisa exigir rolagem interna neste viewport'
  ).toBeGreaterThan(alturaVisivel);

  const rolagemAntes = await balao.evaluate((elemento) => elemento.scrollTop);
  await page.mouse.wheel(0, 150);
  await expect
    .poll(() => balao.evaluate((elemento) => elemento.scrollTop))
    .toBeGreaterThan(rolagemAntes);

  // Rolar dentro do balão não o fechou.
  await expect(balao).toBeVisible();
});
