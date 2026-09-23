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

/**
 * Achado do QA na primeira versão deste arquivo: a faixa de aviso de
 * armazenamento (AvisoArmazenamento.vue, fixa no rodapé, primeira
 * visita) nunca era dispensada, e em 360px ela cobre a área dos botões
 * "Anterior"/"Próxima" — o clique em "Próxima" expirava depois da
 * primeira pergunta, reprovando o teste sempre (contra o pacote
 * corrigido OU não), sem provar nada. As três chaves abaixo são
 * pré-carregadas em localStorage (mesmo padrão de
 * tests/e2e/modo-adaptado-320.spec.ts para o modo adaptado) ANTES de
 * `page.goto`, em vez de clicar em "Entendi"/"Ativar modo...": o teste
 * não depende de nenhum desses botões existirem nem do texto exato do
 * rótulo deles.
 */
const CHAVE_TEMA = 'caderno-direito:v1:tema';
const CHAVE_MODO_ADAPTADO = 'caderno-direito:v1:modo-adaptado';
const CHAVE_AVISO_ARMAZENAMENTO_VISTO = 'caderno-direito:v1:aviso-armazenamento-visto';

async function irParaQuizEscuroModoAdaptado(page: Page, caminho: string): Promise<void> {
  await page.addInitScript(
    ({ chaveTema, chaveModo, chaveAviso }) => {
      window.localStorage.setItem(chaveTema, 'escuro');
      window.localStorage.setItem(chaveModo, 'true');
      window.localStorage.setItem(chaveAviso, '1');
    },
    {
      chaveTema: CHAVE_TEMA,
      chaveModo: CHAVE_MODO_ADAPTADO,
      chaveAviso: CHAVE_AVISO_ARMAZENAMENTO_VISTO
    }
  );
  await page.goto(caminho);
  await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
  await page.locator('.cartao-pergunta').first().waitFor({ state: 'visible' });
  // Prova de que a faixa de fato não apareceu (e não só que o teste
  // parou de precisar dela): se ela existisse no DOM, os cliques em
  // "Próxima" mais abaixo arriscariam o mesmo timeout de antes.
  await expect(page.locator('.aviso-armazenamento')).toHaveCount(0);
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
