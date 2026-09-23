import { test, expect, type Page } from '@playwright/test';

/**
 * Achado do QA (docs/qa-redacao-u1.md, seção "Rodada final"): em tema
 * escuro, 360px e modo adaptado ligado, o quiz estourava a largura da
 * página em 2 de 10 carregamentos aleatórios (80px numa pergunta sobre a
 * estrutura de oito passos, cujas alternativas são listas separadas por
 * vírgula; 13px numa pergunta sobre o art. 1.658). O quiz sorteia a
 * ordem a cada carga, então testar só ALGUMAS perguntas passa por sorte
 * (como passou antes). Este teste substitui a sorte por varredura
 * completa: percorre as 30 perguntas da unidade nova E as 60 da
 * unidade-piloto, uma a uma, na mesma combinação que reproduziu o
 * defeito.
 *
 * Medido só em jsdom não prova nada aqui (jsdom não faz layout real,
 * scrollWidth/clientWidth sempre 0 — mesma nota de
 * responsividade-360.spec.ts), por isso este é um teste de PONTA A
 * PONTA (Playwright), não vitest/jsdom. Este arquivo não foi executado
 * por mim (regra da noite/manhã: sem teste em navegador desta sessão);
 * o QA roda sob o protocolo de isolamento já em uso.
 */
test.use({ viewport: { width: 360, height: 800 } });

const CHAVE_TEMA = 'caderno-direito:v1:tema';

async function irParaQuizEscuroModoAdaptado(page: Page, caminho: string): Promise<void> {
  // Tema escuro pré-carregado via localStorage (lido de forma síncrona no
  // boot da store, src/app/stores/tema.ts): mais confiável do que clicar
  // no alternador, que exigiria adivinhar o rótulo/estado inicial.
  await page.addInitScript((chave) => window.localStorage.setItem(chave, 'escuro'), CHAVE_TEMA);
  await page.goto(caminho);
  await page
    .getByRole('button', {
      name: 'Ativar modo de leitura adaptada: texto maior e contraste máximo em preto e branco'
    })
    .click();
  await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
  await page.locator('.cartao-pergunta').first().waitFor({ state: 'visible' });
}

async function medirEstouro(page: Page): Promise<{ scrollWidth: number; clientWidth: number }> {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
}

/**
 * Percorre as `total` perguntas da rodada atual, clicando em "Próxima" a
 * cada passo, e mede o estouro de largura da PÁGINA em cada uma. A ordem
 * é embaralhada (semente aleatória a cada carga), mas percorrer as N-1
 * transições cobre as N perguntas de qualquer jeito, seja qual for a
 * ordem sorteada.
 */
async function varrerTodasAsPerguntas(
  page: Page,
  total: number,
  nomeUnidade: string
): Promise<void> {
  for (let indice = 0; indice < total; indice++) {
    await expect(page.locator('.cartao-pergunta')).toBeVisible();
    const { scrollWidth, clientWidth } = await medirEstouro(page);
    const textoEnunciado = await page.locator('.cartao-pergunta__enunciado').innerText();
    expect(
      scrollWidth,
      `${nomeUnidade}, pergunta ${indice + 1}/${total} ("${textoEnunciado.slice(0, 80)}"): ` +
        `scrollWidth ${scrollWidth} vs clientWidth ${clientWidth}`
    ).toBe(clientWidth);

    if (indice < total - 1) {
      await page.getByRole('button', { name: 'Próxima' }).click();
    }
  }
}

test('unidade Português e Redação Jurídica 1: nenhuma das 30 perguntas estoura 360px, escuro, modo adaptado', async ({
  page
}) => {
  await irParaQuizEscuroModoAdaptado(page, '/p/p1/redacao-juridica-1/u1/quiz');
  await varrerTodasAsPerguntas(page, 30, 'Redação Jurídica 1');
});

test('unidade-piloto (Introdução ao Direito): nenhuma das 60 perguntas estoura 360px, escuro, modo adaptado', async ({
  page
}) => {
  await irParaQuizEscuroModoAdaptado(page, '/p/p1/intr-direito/u1/quiz');
  await varrerTodasAsPerguntas(page, 60, 'Introdução ao Direito');
});
