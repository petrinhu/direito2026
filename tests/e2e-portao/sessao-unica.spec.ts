import AxeBuilder from '@axe-core/playwright';
import { devices, expect, test, type Browser, type Page } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { capturar, entrarNoApp, esperarApp, esperarEntrada, preencherEntrada } from './apoio/acoes';
import { CONTA_ADMIN, ORIGEM } from './apoio/constantes';

/**
 * SU-F1 (plano da sessão única, seção 1.6): o aparelho que cai percebe na próxima
 * troca de página, e não só num pedido de dado. A janela de 30 s entre conferências
 * é provada com o relógio falso do Playwright (`page.clock`): o teste avança o tempo
 * em vez de esperar.
 *
 * Dois aparelhos com a mesma conta. O último a entrar fica; o primeiro cai na
 * próxima troca de página e vê a tela de entrada com o aviso (SU-B2).
 */

const TEXTO_AVISO = 'Sua conta foi aberta em outro aparelho. Entre de novo para continuar aqui.';
/** Um pouco mais que a janela de 30 s, para a borda não ser a que está sendo testada. */
const PASSO_MAIOR_QUE_JANELA_MS = 31_000;

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
    await expect(page.locator('#app')).not.toBeEmpty();
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
        await capturar(page, `f1-entrada-aviso-${largura}-${tema}`);
      }
      const resultado = await new AxeBuilder({ page }).analyze();
      expect(resultado.violations, `axe no tema ${tema}`).toEqual([]);
    }
    await page.setViewportSize({ width: 1280, height: 720 });

    // O último a entrar agora é A: A entra de novo e volta ao mesmo endereço.
    await preencherEntrada(page, CONTA_ADMIN);
    await esperarApp(page);
    await expect(page).toHaveURL(/\/calendario$/);

    // B, que não mexeu desde que A entrou, cai só agora, na troca de página dele.
    await aparelhoB.page.clock.fastForward(PASSO_MAIOR_QUE_JANELA_MS);
    await trocarPaginaPeloMenu(aparelhoB.page, 'Trocar senha');
    await esperarEntrada(aparelhoB.page);
    await expect(aparelhoB.page.getByRole('alert')).toHaveText(TEXTO_AVISO);
  } finally {
    await aparelhoB.fechar();
  }
});
