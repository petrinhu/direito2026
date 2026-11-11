import AxeBuilder from '@axe-core/playwright';
import { devices, expect, test, type Browser, type Page } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { capturar, entrarNoApp, esperarEntrada } from './apoio/acoes';
import { CONTA_ADMIN, ORIGEM } from './apoio/constantes';

/**
 * SU-F1 (plano da sessão única, seção 1.6): o aparelho que cai percebe na próxima
 * troca de página, e não só num pedido de dado. A janela de 30 s entre conferências
 * é provada com o relógio falso do Playwright (`page.clock`): o teste avança o tempo
 * em vez de esperar.
 *
 * Dois aparelhos com a mesma conta. O último a entrar fica; o primeiro cai na
 * próxima troca de página e vê a tela de entrada com o aviso (SU-B2).
 *
 * Cada aparelho cai num teste próprio. Num teste só, a queda do primeiro aborta o
 * teste e a do segundo nunca roda, então uma regressão só na conferência do segundo
 * passaria despercebida.
 */

const TEXTO_AVISO = 'Sua conta foi aberta em outro aparelho. Entre de novo para continuar aqui.';
/** Um pouco mais que a janela de 30 s, para a borda não ser a que está sendo testada. */
const PASSO_MAIOR_QUE_JANELA_MS = 31_000;
/** Tempo até a conferência chegar; curto, para a regressão aparecer sem esperar o teste inteiro. */
const TEMPO_ESPERA_CONFERENCIA_MS = 10_000;

test.beforeEach(() => resetarPrivado());

/** Um aparelho novo, com o mesmo perfil de desktop do projeto e o relógio falso já instalado. */
async function abrirAparelho(
  browser: Browser
): Promise<{ page: Page; fechar: () => Promise<void> }> {
  const contexto = await browser.newContext({ ...devices['Desktop Chrome'], baseURL: ORIGEM });
  const page = await contexto.newPage();
  await page.clock.install();
  return { page, fechar: () => contexto.close() };
}

/** Troca de página pelo próprio menu do app (link, sem goto: goto recarregaria a página). */
async function trocarPaginaPeloMenu(
  page: Page,
  nome: 'Calendário' | 'Trocar senha'
): Promise<void> {
  await page.getByRole('link', { name: nome }).click();
}

/** Está no app, não na entrada: o link do menu só existe dentro do app, e o formulário da entrada não aparece. */
async function esperarNoApp(page: Page): Promise<void> {
  await expect(page.getByRole('link', { name: 'Calendário' })).toBeVisible();
  await expect(page.locator('#senha')).toHaveCount(0);
}

/**
 * Troca de página e a resposta de /api/sessao.php que ela dispara. Devolve o corpo dessa resposta.
 *
 * O pedido passa por `route`, e não por `waitForResponse`: a página recarrega logo depois de
 * receber autenticado:false, e a leitura do corpo pelo lado da página chega depois da recarga,
 * quando o recurso já sumiu (corrida medida: passa numa execução e falha na outra). Aqui o corpo é
 * lido por fora, com `route.fetch()`, e entregue à página sem alteração (`route.fulfill`).
 */
async function trocarPaginaEConferir(
  page: Page,
  nome: 'Calendário' | 'Trocar senha'
): Promise<unknown> {
  let corpo: unknown;
  let liberar: () => void = () => undefined;
  const lido = new Promise<void>((resolver) => {
    liberar = resolver;
  });
  await page.route(
    '**/api/sessao.php',
    async (rota) => {
      const resposta = await rota.fetch();
      corpo = await resposta.json().catch(() => undefined);
      await rota.fulfill({ response: resposta });
      liberar();
    },
    { times: 1 }
  );
  await trocarPaginaPeloMenu(page, nome);
  const limite = new Promise<never>((_, rejeitar) => {
    setTimeout(
      () => rejeitar(new Error('a troca não chamou /api/sessao.php a tempo')),
      TEMPO_ESPERA_CONFERENCIA_MS
    );
  });
  await Promise.race([lido, limite]);
  return corpo;
}

test('sessão única: o último a entrar fica; o anterior cai na troca de página e vê o aviso', async ({
  page,
  browser
}) => {
  await page.clock.install();
  await entrarNoApp(page, CONTA_ADMIN, '/');

  // Aquece as duas páginas que o teste vai usar: o pedaço de código de cada uma
  // precisa estar no cache do navegador, senão a troca pede um arquivo ao portão.
  await page.clock.fastForward(PASSO_MAIOR_QUE_JANELA_MS);
  await trocarPaginaPeloMenu(page, 'Calendário');
  await expect(page).toHaveURL(/\/calendario$/);
  await page.clock.fastForward(PASSO_MAIOR_QUE_JANELA_MS);
  await trocarPaginaPeloMenu(page, 'Trocar senha');
  await expect(page).toHaveURL(/\/conta$/);

  const aparelhoB = await abrirAparelho(browser);
  try {
    await entrarNoApp(aparelhoB.page, CONTA_ADMIN, '/');
    await expect(aparelhoB.page.locator('#app')).not.toBeEmpty();

    // A ainda está com a página aberta e não caiu: só cai na próxima troca.
    await esperarNoApp(page);
    await page.clock.fastForward(PASSO_MAIOR_QUE_JANELA_MS);
    await trocarPaginaPeloMenu(page, 'Calendário');

    await esperarEntrada(page);
    await expect(page.getByRole('alert')).toHaveText(TEXTO_AVISO);
    await expect(page).toHaveURL(/\/calendario$/);

    // Aviso de uso único: o cookie sai na primeira exibição, então todas as capturas e
    // o axe saem desta mesma página, sem recarregar. O tema vem da preferência do sistema
    // (sem cookie de escolha), e viewport muda sem recarregar.
    for (const tema of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: tema });
      for (const largura of [360, 1280] as const) {
        await page.setViewportSize({ width: largura, height: largura === 360 ? 740 : 800 });
        if (largura === 360) {
          const semRolagemHorizontal = await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
          );
          expect(semRolagemHorizontal, `rolagem horizontal a 360 px, tema ${tema}`).toBe(true);
        }
        await capturar(page, `f1-entrada-aviso-${largura}-${tema}`);
      }
      const resultado = await new AxeBuilder({ page }).analyze();
      expect(resultado.violations, `axe no tema ${tema}`).toEqual([]);
    }
  } finally {
    await aparelhoB.fechar();
  }
});

test('sessão única: o aparelho que entrou antes cai na própria troca de página', async ({
  page,
  browser
}) => {
  await page.clock.install();
  const anterior = await abrirAparelho(browser);
  try {
    const aparelho = anterior.page;
    await entrarNoApp(aparelho, CONTA_ADMIN, '/');

    // Aquece Calendário e Trocar senha neste aparelho, antes de a conta ser aberta de novo. Sem isso,
    // a troca pede o pedaço de código ao portão, que recusa a sessão caída (401): a queda sairia por aí,
    // e não pela conferência que este teste quer provar. Com o cache aquecido, a única chamada ao
    // servidor na troca é a conferência em /api/sessao.php.
    await aparelho.clock.fastForward(PASSO_MAIOR_QUE_JANELA_MS);
    await trocarPaginaPeloMenu(aparelho, 'Calendário');
    await expect(aparelho).toHaveURL(/\/calendario$/);
    await aparelho.clock.fastForward(PASSO_MAIOR_QUE_JANELA_MS);
    await trocarPaginaPeloMenu(aparelho, 'Trocar senha');
    await expect(aparelho).toHaveURL(/\/conta$/);

    // Agora a conta é aberta de novo, e este aparelho fica para trás.
    await entrarNoApp(page, CONTA_ADMIN, '/');
    await esperarNoApp(aparelho);

    // Passa da janela desde a última conferência. A troca tem de ir ao servidor, e o servidor
    // responde autenticado:false. Só essa resposta explica a queda abaixo.
    await aparelho.clock.fastForward(PASSO_MAIOR_QUE_JANELA_MS);
    const corpo = await trocarPaginaEConferir(aparelho, 'Calendário');
    expect(corpo, 'conferência na troca: /api/sessao.php').toMatchObject({ autenticado: false });

    await esperarEntrada(aparelho);
    await expect(aparelho.getByRole('alert')).toHaveText(TEXTO_AVISO);
    await expect(aparelho).toHaveURL(/\/calendario$/);
  } finally {
    await anterior.fechar();
  }
});
