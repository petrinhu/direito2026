import { test, expect } from '@playwright/test';

/**
 * CRÍTICOS 1 e 2 do QA (docs/qa-modo-adaptado.md): com o modo adaptado
 * ligado, a trilha do cabeçalho (TrilhaNavegacao.vue) não quebra linha
 * nem encolhe o texto (`flex-wrap: nowrap` + `white-space: nowrap`, sem
 * exceção para o modo) - o texto de cada item PINTA POR CIMA do item
 * vizinho (achado 1, qualquer largura, inclusive 1280px) e, na home em
 * 320px, o título vaza para fora da tela sem gerar rolagem (achado 2,
 * mesma causa raiz).
 *
 * Medição direta do defeito (não aparência): um <a> cujo texto não cabe
 * na própria caixa, sem quebra de linha nem reticências, tem
 * `scrollWidth` maior que `clientWidth` - é exatamente esse excesso que
 * pinta sobre o vizinho ou vaza pela borda da janela. Depois da correção
 * (a trilha passa a quebrar linha no modo), cada item cresce em ALTURA,
 * nunca vaza em LARGURA.
 */
async function ligarModoPeloBotao(page: import('@playwright/test').Page): Promise<void> {
  await page
    .getByRole('button', {
      name: 'Ativar modo de leitura adaptada: texto maior e contraste máximo em preto e branco'
    })
    .click();
  await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
}

async function nenhumLinkDaTrilhaVaza(page: import('@playwright/test').Page): Promise<void> {
  const vazamentos = await page.evaluate(() => {
    const resultado: Array<{ texto: string; scrollWidth: number; clientWidth: number }> = [];
    for (const a of Array.from(document.querySelectorAll<HTMLElement>('.trilha-navegacao a'))) {
      if (a.scrollWidth > a.clientWidth + 1) {
        resultado.push({
          texto: a.textContent?.trim() ?? '',
          scrollWidth: a.scrollWidth,
          clientWidth: a.clientWidth
        });
      }
    }
    return resultado;
  });
  expect(vazamentos, JSON.stringify(vazamentos)).toEqual([]);
}

test('crítico 1: em 1280px, com o modo ligado, nenhum item da trilha da unidade vaza (pintaria sobre o vizinho)', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/p/p1/intr-direito/u1');
  await ligarModoPeloBotao(page);
  await page.locator('.trilha-navegacao a').first().waitFor({ state: 'visible' });
  await nenhumLinkDaTrilhaVaza(page);
});

test('crítico 1: mesma prova nas abas petição e quiz', async ({ page }) => {
  // O modo persiste em localStorage entre navegações (critério 9, por
  // desenho) - a segunda volta do laço já nasce ligada, então o botão já
  // diz "Desativar...", não "Ativar...". Liga só uma vez, antes do laço.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/p/p1/intr-direito/u1/peticao');
  await ligarModoPeloBotao(page);
  for (const aba of ['peticao', 'quiz']) {
    await page.goto(`/p/p1/intr-direito/u1/${aba}`);
    await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
    await page.locator('.trilha-navegacao a').first().waitFor({ state: 'visible' });
    await nenhumLinkDaTrilhaVaza(page);
  }
});

test('crítico 2: em 320px, com o modo ligado, o título do cabeçalho da home não vaza para fora da tela', async ({
  page
}) => {
  // Em 320px o botão do modo fica fora da área visível antes de rolar
  // (mesmo em modo normal, sem relação com este achado) - liga o modo
  // pela mesma chave de localStorage que tests/e2e/modo-adaptado-320.spec.ts
  // já usa, em vez de depender de clicar um botão fora de tela.
  await page.addInitScript(() => {
    localStorage.setItem('caderno-direito:v1:modo-adaptado', 'true');
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
  await page.locator('.trilha-navegacao a').first().waitFor({ state: 'visible' });
  await nenhumLinkDaTrilhaVaza(page);
});
