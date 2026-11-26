import type { Locator, Page } from '@playwright/test';
import { test, expect } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar } from './apoio/estadoInicial';

/**
 * Bloco do aviso de armazenamento na primeira visita (sem a chave de "já visto").
 *
 * Decisão do líder (07/11/2026): o aviso é um bloco no topo do conteúdo, que rola com a página. Não
 * é fixo nem sticky, então não cobre o campo de busca nem o menu. A regra de 187 px a 1280 vem da
 * v1.5.0.0 e continua valendo para a altura do bloco.
 */
const ALTURA_MAXIMA_1280 = 187;

/**
 * Rola até o campo, espera o layout assentar e mede o centro dele. Sem a rolagem, um campo abaixo
 * da primeira tela devolve null no elementFromPoint, e null conta como coberto (reprova), nunca
 * como livre (TEST-COBERTURA-NULL; mesmo critério de a41ed8b).
 */
async function medirCampoAposRolar(
  page: Page,
  campo: Locator
): Promise<{ centroNaJanela: boolean; coberto: boolean; noCentro: string }> {
  await campo.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await esperarLayoutAssentar(page);
  return campo.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const centroY = r.top + r.height / 2;
    const topo = document.elementFromPoint(r.left + r.width / 2, centroY);
    return {
      centroNaJanela: centroY >= 0 && centroY < window.innerHeight,
      coberto: topo === null || topo.closest('.aviso-armazenamento') !== null,
      noCentro:
        topo === null ? 'nada' : `${topo.tagName.toLowerCase()}.${topo.getAttribute('class') ?? ''}`
    };
  });
}

test('1280x720: a faixa não cobre o campo de busca na primeira visita e não passa de 187 px', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/busca');
  const campo = page.locator('#campo-busca-input');
  await campo.waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  const faixa = page.locator('.aviso-armazenamento');
  await expect(faixa).toBeVisible();

  const medida = await medirCampoAposRolar(page, campo);
  expect(medida.centroNaJanela, 'centro do campo de busca dentro da janela depois de rolar').toBe(
    true
  );
  expect(medida.coberto, `o aviso cobre o campo de busca (no centro: ${medida.noCentro})`).toBe(
    false
  );

  const caixa = await faixa.boundingBox();
  expect(caixa).not.toBeNull();
  expect(caixa!.height).toBeLessThanOrEqual(ALTURA_MAXIMA_1280);
});

test('360x640: o aviso é bloco do fluxo, não cobre o campo de busca, e rola com a página', async ({
  page
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/busca');
  const campo = page.locator('#campo-busca-input');
  await campo.waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  const faixa = page.locator('.aviso-armazenamento');
  await expect(faixa).toBeVisible();
  const posicao = await faixa.evaluate((el) => getComputedStyle(el).position);
  expect(['static', 'relative']).toContain(posicao);
  // A ordem na página não é decisão de produto: o aviso fica logo abaixo da barra,
  // depois do campo (LayoutBase.vue:191 e :208). O que o líder decidiu é que o aviso
  // não cobre nada, então a asserção é essa, a mesma do teste de 1280 px.
  const medida = await medirCampoAposRolar(page, campo);
  expect(medida.centroNaJanela, 'centro do campo de busca dentro da janela depois de rolar').toBe(
    true
  );
  expect(
    medida.coberto,
    `o aviso cobre o centro do campo de busca a 360x640 (${medida.noCentro})`
  ).toBe(false);
});
