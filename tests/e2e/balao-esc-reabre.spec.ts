import { expect, test, type Page } from '@playwright/test';

/**
 * QA-BAL-D1 e QA-BAL-D2 (QA visual de 14/11, /var/tmp/onda-zip-1211/qa/qa-b326049b.md).
 *
 * D1: depois de fechar um balão com Esc, o MESMO gatilho não reabre com um clique (nem com
 * Enter ou Espaço pelo teclado). Causa: o controlador guarda "aberto" depois do fechamento
 * nativo, e o clique seguinte cai no ramo "já aberto, então fecha".
 *
 * D2: na sequência cc-12, cpc-497, cc-12, cpc-497, cpc-322, com Esc entre os cliques, o Esc
 * não fecha o cpc-322 em 1280 px, nos temas claro e escuro.
 *
 * Roda contra o pacote servido (vite preview), como o resto de tests/e2e/.
 */
const PECA = '/p/p1/intr-direito/u3-material-danos-morais/peticao';
const TRES = ['cc-12', 'cpc-322', 'cpc-497'] as const;

function gatilho(page: Page, id: string) {
  return page.locator(`button.citacao[data-dispositivo="${id}"]`).first();
}

async function balaoAberto(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.getElementById('balao-dispositivo')?.matches(':popover-open') ?? false
  );
}

async function esperarAberto(page: Page, aberto: boolean, mensagem: string): Promise<void> {
  await expect.poll(() => balaoAberto(page), { message: mensagem, timeout: 3000 }).toBe(aberto);
}

for (const id of TRES) {
  // Clique SEM passagem do ponteiro: o hover abre o balão sozinho (120 ms) e mascara o defeito.
  test(`QA-BAL-D1 · ${id} · clique: reabre com um clique depois do Esc`, async ({ page }) => {
    await page.goto(PECA);
    await gatilho(page, id).scrollIntoViewIfNeeded();
    await gatilho(page, id).click();
    await esperarAberto(page, true, `${id}: abre no primeiro clique`);
    await page.keyboard.press('Escape');
    await esperarAberto(page, false, `${id}: Esc fecha`);
    await gatilho(page, id).evaluate((el) => (el as HTMLElement).click());
    await esperarAberto(page, true, `${id}: reabre com um clique depois do Esc`);
  });

  // Toque: não há hover, então o único caminho é o clique. Sem o hover mascarando o estado.
  test(`QA-BAL-D1 · ${id} · toque: reabre com um toque depois do Esc`, async ({ browser }) => {
    const contexto = await browser.newContext({
      hasTouch: true,
      viewport: { width: 1280, height: 800 }
    });
    const page = await contexto.newPage();
    await page.goto(PECA);
    await gatilho(page, id).tap();
    await esperarAberto(page, true, `${id}: abre no primeiro toque`);
    await page.keyboard.press('Escape');
    await esperarAberto(page, false, `${id}: Esc fecha`);
    await gatilho(page, id).tap();
    await esperarAberto(page, true, `${id}: reabre com um toque depois do Esc`);
    await contexto.close();
  });

  // Fluxo do teclado do QA: foco abre o balão, Esc fecha (foco fica), Enter ou Espaço reabre.
  for (const tecla of ['Enter', ' '] as const) {
    test(`QA-BAL-D1 · ${id} · teclado: foco abre, Esc fecha, ${tecla === ' ' ? 'Espaço' : 'Enter'} reabre`, async ({
      page
    }) => {
      await page.goto(PECA);
      await gatilho(page, id).focus();
      await esperarAberto(page, true, `${id}: o foco abre o balão`);
      await page.keyboard.press('Escape');
      await esperarAberto(page, false, `${id}: Esc fecha`);
      await page.keyboard.press(tecla);
      await esperarAberto(
        page,
        true,
        `${id}: ${tecla === ' ' ? 'Espaço' : 'Enter'} reabre depois do Esc`
      );
    });
  }
}
