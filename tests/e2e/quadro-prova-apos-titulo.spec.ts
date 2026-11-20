import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * E2E-G1A-ADAPTADO (Ramo B da F2, decisão do CTO de 20/11/2026, a ratificar pelo líder): no modo
 * adaptado, na página de unidade, o quadro de prova fica logo depois do título, dentro de main. Ao
 * sair da unidade ele volta ao topo do conteúdo e, ao entrar noutra, reaparece depois do novo título:
 * nunca some e nunca fica preso numa página que já saiu.
 */
const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const UNIDADE = '/p/p1/intr-direito/u1';
const OUTRA_UNIDADE = '/p/p1/filosofia-juridica/u1';

async function navegarPeloRoteador(page: Page, caminho: string): Promise<void> {
  await page.evaluate((destino) => {
    window.history.pushState({}, '', destino);
    window.dispatchEvent(new window.PopStateEvent('popstate'));
  }, caminho);
  await page.waitForURL(`**${caminho}`);
  await esperarLayoutAssentar(page);
}

async function ondeEstaOQuadro(page: Page): Promise<string> {
  return page.evaluate(() => {
    const quadro = document.querySelector('aside.quadro-prova');
    if (!quadro) return 'ausente';
    const alvo = quadro.closest('.alvo-quadro-prova');
    if (alvo)
      return alvo.previousElementSibling?.tagName === 'H1'
        ? 'depois-do-titulo'
        : 'alvo-fora-do-lugar';
    if (quadro.closest('#quadro-prova-do-conteudo')) return 'topo-do-conteudo';
    if (quadro.closest('.layout-base__inferior')) return 'pilha';
    return 'outro';
  });
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(DATA_FIXA));
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
  await page.setViewportSize({ width: 360, height: 640 });
});

test('quadro depois do título na unidade, modo adaptado, 360px', async ({ page }) => {
  await page.goto(UNIDADE);
  await page.locator('main h1').first().waitFor({ state: 'visible' });
  await esperarLayoutAssentar(page);
  expect(await ondeEstaOQuadro(page)).toBe('depois-do-titulo');
});

test('quadro acompanha a navegação sem sumir, modo adaptado, 360px', async ({ page }) => {
  await page.goto(UNIDADE);
  await page.locator('main h1').first().waitFor({ state: 'visible' });
  await esperarLayoutAssentar(page);
  await navegarPeloRoteador(page, '/');
  expect(await ondeEstaOQuadro(page)).toBe('topo-do-conteudo');
  await navegarPeloRoteador(page, OUTRA_UNIDADE);
  expect(await ondeEstaOQuadro(page)).toBe('depois-do-titulo');
  await navegarPeloRoteador(page, UNIDADE);
  expect(await ondeEstaOQuadro(page)).toBe('depois-do-titulo');
});
