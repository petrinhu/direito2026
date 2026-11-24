import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * ADAPTADO-U1-ROLAGEM-LATERAL (WCAG 2.2, 1.4.10 Refluxo): no modo adaptado, na unidade u1 de Introdução
 * ao Direito, entre 641 e 1024 px a página não pode rolar para o lado. Mede a própria página (não um
 * quadro de tabela, que tem rolagem própria por desenho) e aponta os elementos que passam da janela,
 * para que a falha diga qual é o culpado.
 */
const UNIDADE = '/p/p1/intr-direito/u1';
const LARGURAS = [641, 768, 810, 881, 1024] as const;
const ALTURA_DA_JANELA = 800;
const DATA_FIXA = '2026-11-14T12:00:00-03:00';

interface MedidaLargura {
  scrollWidth: number;
  clientWidth: number;
  culpados: string[];
}

async function medirPagina(page: Page): Promise<MedidaLargura> {
  return page.evaluate(() => {
    const raiz = document.documentElement;
    const janela = raiz.clientWidth;
    const culpados: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (el.getClientRects().length === 0) continue;
      const caixa = el.getBoundingClientRect();
      if (caixa.right > janela + 0.5) {
        const classe = typeof el.className === 'string' ? el.className.trim() : '';
        const marca = classe ? `.${classe.split(/\s+/).join('.')}` : '';
        culpados.push(
          `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${marca} (direita ${caixa.right.toFixed(0)} px)`
        );
      }
      if (culpados.length >= 8) break;
    }
    return { scrollWidth: raiz.scrollWidth, clientWidth: janela, culpados };
  });
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(DATA_FIXA));
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
});

for (const largura of LARGURAS) {
  test(`u1 no modo adaptado não rola para o lado a ${largura} px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
    await page.goto(UNIDADE);
    await page.locator('main h1').first().waitFor({ state: 'visible' });
    await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
    await page.locator('table').first().waitFor({ state: 'attached' });
    await esperarLayoutAssentar(page);

    const medida = await medirPagina(page);
    expect(
      medida.scrollWidth,
      `a ${largura} px: scrollWidth ${medida.scrollWidth} contra clientWidth ${medida.clientWidth}; elementos que passam da janela: ${medida.culpados.join(' | ') || 'nenhum achado'}`
    ).toBeLessThanOrEqual(medida.clientWidth);
  });
}
