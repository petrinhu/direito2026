import { expect, test, type Page } from '@playwright/test';

/**
 * QA-BAL-D2 (QA visual de 14/11): na sequência cc-12, cpc-497, cc-12, cpc-497, cpc-322, com Esc
 * entre os cliques e reabertura pelo mesmo gatilho, o Esc tem de fechar cada balão, inclusive o
 * cpc-322 em 1280 px nos temas claro e escuro.
 *
 * Esta guarda NÃO reproduziu o defeito do QA neste ambiente (Blink, mouse, toque e teclado), nem
 * antes nem depois da correção de QA-BAL-D1. Fica como regressão da sequência do relatório.
 */
const PECA = '/p/p1/intr-direito/u3-material-danos-morais/peticao';

function gatilho(page: Page, id: string) {
  return page.locator(`button.citacao[data-dispositivo="${id}"]`).first();
}

async function esperarAberto(page: Page, aberto: boolean, mensagem: string): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(
          () => document.getElementById('balao-dispositivo')?.matches(':popover-open') ?? false
        ),
      {
        message: mensagem,
        timeout: 3000
      }
    )
    .toBe(aberto);
}

for (const esquema of ['light', 'dark'] as const) {
  test(`QA-BAL-D2 · 1280 px · ${esquema}: Esc fecha cada balão da sequência, incluindo o cpc-322`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ colorScheme: esquema });
    await page.goto(PECA);
    // Como no QA: depois de cada Esc, um clique de reabertura no mesmo gatilho (o defeito D1 entra aqui).
    const sequencia = ['cc-12', 'cpc-497', 'cc-12', 'cpc-497', 'cpc-322'] as const;
    for (const [i, id] of sequencia.entries()) {
      await gatilho(page, id).scrollIntoViewIfNeeded();
      await gatilho(page, id).click();
      await esperarAberto(page, true, `passo ${i + 1} ${id}: abre`);
      await page.keyboard.press('Escape');
      await esperarAberto(page, false, `passo ${i + 1} ${id}: Esc fecha`);
      await gatilho(page, id).click();
      await esperarAberto(page, true, `passo ${i + 1} ${id}: reabre com um clique depois do Esc`);
      await page.keyboard.press('Escape');
      await esperarAberto(page, false, `passo ${i + 1} ${id}: Esc fecha de novo`);
    }
  });
}
