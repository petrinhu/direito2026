import { test, expect } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar } from './apoio/estadoInicial';

/**
 * Critério 2 da especificação (docs/modo-adaptado.md, seção 8): em 320px de
 * largura CSS, com o modo adaptado ligado, nenhuma rolagem horizontal da
 * página. Mesmo padrão de tests/e2e/responsividade-360.spec.ts (layout
 * real, por isso Playwright, não jsdom), mas ligando o modo ANTES de medir,
 * via a mesma chave de localStorage que o repositório real usa
 * (src/app/persistencia/RepositorioLocalStorage.ts, prefixo
 * "caderno-direito:v1").
 */
test.use({ viewport: { width: 320, height: 800 } });

/**
 * Relógio fixo (E2E-G1-320, decisão de 20/11/2026): a faixa do quadro de prova muda o tamanho da
 * pílula (QuadroProva.vue) e, com ela, a largura da linha do topo. Sem data fixa o resultado depende
 * do dia em que o teste roda. 14/11/2026 é a data da sonda da a11y que mediu 346 px contra 320.
 */
const DATA_FIXA = '2026-11-14T12:00:00-03:00';

async function ligarModoAdaptado(page: import('@playwright/test').Page, caminho: string) {
  await page.clock.setFixedTime(new Date(DATA_FIXA));
  await page.addInitScript(() => {
    localStorage.setItem('caderno-direito:v1:modo-adaptado', 'true');
  });
  await page.goto(caminho);
}

test('em 320px, com o modo adaptado ligado, a home não estoura a largura', async ({ page }) => {
  await ligarModoAdaptado(page, '/');
  await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });

  const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
  const larguraJanela = await page.evaluate(() => document.documentElement.clientWidth);

  expect(larguraDocumento, `scrollWidth ${larguraDocumento} vs clientWidth ${larguraJanela}`).toBe(
    larguraJanela
  );
});

test('em 320px, com o modo adaptado ligado, a página de unidade não estoura a largura', async ({
  page
}) => {
  await ligarModoAdaptado(page, '/p/p1/intr-direito/u1');
  await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
  await page.locator('table').first().waitFor({ state: 'attached' });

  const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
  const larguraJanela = await page.evaluate(() => document.documentElement.clientWidth);

  expect(larguraDocumento, `scrollWidth ${larguraDocumento} vs clientWidth ${larguraJanela}`).toBe(
    larguraJanela
  );
});

test('em 320px, com o modo adaptado ligado, o botão do quadro de prova cabe no próprio texto', async ({
  page
}) => {
  await ligarModoAdaptado(page, '/p/p1/intr-direito/u1');
  const localBotao = page.locator('aside.quadro-prova .quadro-prova__alternar');
  await localBotao.waitFor({ state: 'visible' });
  // Fora da janela, elementFromPoint devolve null (CSSOM View), e a 320 x 800 o botão pode ficar
  // abaixo da primeira tela: sem rolar até ele, "coberto" media "fora da janela" (E2E-G1-320).
  await localBotao.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await esperarLayoutAssentar(page);

  const botao = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('aside.quadro-prova .quadro-prova__alternar')!;
    const caixa = el.getBoundingClientRect();
    const centroY = caixa.top + caixa.height / 2;
    const alvo = document.elementFromPoint(caixa.left + caixa.width / 2, centroY);
    return {
      larguraTexto: el.scrollWidth,
      larguraBotao: el.clientWidth,
      largura: caixa.width,
      altura: caixa.height,
      centroNaJanela: centroY >= 0 && centroY < window.innerHeight,
      noCentro:
        alvo === null
          ? 'nada'
          : `${alvo.tagName.toLowerCase()}.${alvo.getAttribute('class') ?? ''}`,
      coberto: !(alvo !== null && (alvo === el || el.contains(alvo)))
    };
  });

  expect(botao.larguraTexto, 'texto do botão não passa da largura do botão').toBeLessThanOrEqual(
    botao.larguraBotao
  );
  expect(botao.largura, 'alvo de toque com 44 px de largura').toBeGreaterThanOrEqual(44);
  expect(botao.altura, 'alvo de toque com 44 px de altura').toBeGreaterThanOrEqual(44);
  expect(botao.centroNaJanela, 'centro do botão dentro da janela depois de rolar até ele').toBe(
    true
  );
  expect(botao.coberto, `botão não coberto por outro elemento (no centro: ${botao.noCentro})`).toBe(
    false
  );
});
