import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp, esperarApp, esperarEntrada, preencherEntrada } from './apoio/acoes';
import { CONTA_ADMIN, CONTA_ANA_PAULA, CONTA_COMUM } from './apoio/constantes';
import { forcarLimite } from './apoio/limiteForcado';

/**
 * Bloqueio por uso simultâneo, no painel do admin (BL-F1, BL-Q1): a conta bloqueada aparece como Bloqueada, o
 * botão Desbloquear pede confirmação e devolve a entrada à conta. Nenhum caso fixa o texto da mensagem de bloqueio
 * (ela vem de telas.php, com nome de pessoa): a checagem da entrada é pela sessão e pela tela, não pela frase.
 */

const ALVO = CONTA_ANA_PAULA.usuario;
const SEM_BLOQUEIO = CONTA_COMUM.usuario;
const ESTADO_BLOQUEADA = 'Bloqueada';
const PERGUNTA_CONFIRMACAO = 'Desbloquear esta conta?';
const TEMAS = ['light', 'dark'] as const;
const LARGURAS_DO_AXE = [360, 1280] as const;

test.beforeEach(() => resetarPrivado());

function linhaDa(page: Page, login: string): Locator {
  return page.getByRole('row').filter({ hasText: login });
}

function botaoDesbloquear(page: Page, login: string): Locator {
  return linhaDa(page, login).getByRole('button', { name: `Desbloquear ${login}` });
}

/** A sessão aberta pelo navegador da pessoa, lida do servidor (sem depender do texto da tela). */
async function sessaoAberta(contexto: BrowserContext): Promise<boolean> {
  const resposta = await contexto.request.get('/api/sessao.php', {
    headers: { Accept: 'application/json' }
  });
  const corpo = (await resposta.json()) as { autenticado?: boolean };
  return corpo.autenticado === true;
}

async function violacoesDoAxe(page: Page): Promise<unknown[]> {
  // Escopo na seção do painel: a casca do app tem violação já conhecida, fora desta fatia.
  const resultado = await new AxeBuilder({ page }).include('.ar-admin').analyze();
  return resultado.violations.map((v) => ({ id: v.id, alvos: v.nodes.map((n) => n.target) }));
}

test('painel: a conta bloqueada aparece como Bloqueada, o Desbloquear pede confirmação e a pessoa volta a entrar', async ({
  page,
  browser
}) => {
  forcarLimite('bloqueada', ALVO);
  const pessoa = await browser.newContext();
  try {
    const aparelho = await pessoa.newPage();
    await aparelho.goto('/');
    await esperarEntrada(aparelho);
    const respostaDaEntrada = aparelho.waitForResponse(
      (r) => r.url().includes('/api/acesso.php') && r.request().method() === 'POST'
    );
    await preencherEntrada(aparelho, CONTA_ANA_PAULA);
    await respostaDaEntrada;
    await expect(aparelho.locator('#app')).toHaveCount(0);
    expect(await sessaoAberta(pessoa), 'sem sessão com a conta bloqueada').toBe(false);

    await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
    await expect(linhaDa(page, ALVO)).toContainText(ESTADO_BLOQUEADA);
    await botaoDesbloquear(page, ALVO).click();
    await expect(page.getByText(PERGUNTA_CONFIRMACAO)).toBeVisible();
    await linhaDa(page, ALVO).locator('[data-acao="confirmar-desbloqueio"]').click();
    await expect(linhaDa(page, ALVO)).not.toContainText(ESTADO_BLOQUEADA);

    await preencherEntrada(aparelho, CONTA_ANA_PAULA);
    await esperarApp(aparelho);
    expect(await sessaoAberta(pessoa), 'sessão aberta depois do Desbloquear').toBe(true);
  } finally {
    await pessoa.close();
  }
});

test('painel: a conta sem bloqueio não mostra o botão Desbloquear, e a bloqueada mostra', async ({
  page
}) => {
  forcarLimite('bloqueada', ALVO);
  await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
  await expect(linhaDa(page, SEM_BLOQUEIO)).toBeVisible();
  await expect(linhaDa(page, SEM_BLOQUEIO)).not.toContainText(ESTADO_BLOQUEADA);
  await expect(
    linhaDa(page, SEM_BLOQUEIO).getByRole('button', { name: /Desbloquear/ })
  ).toHaveCount(0);
  await expect(botaoDesbloquear(page, ALVO)).toBeVisible();
});

for (const largura of LARGURAS_DO_AXE) {
  test(`painel com a conta bloqueada: axe sem violação a ${largura} px, nos dois temas, com e sem a confirmação`, async ({
    page
  }) => {
    forcarLimite('bloqueada', ALVO);
    await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
    const fundos = new Set<string>();
    for (const tema of TEMAS) {
      await page.emulateMedia({ colorScheme: tema });
      await page.setViewportSize({ width: largura, height: 900 });
      await expect(botaoDesbloquear(page, ALVO)).toBeVisible();
      expect(await violacoesDoAxe(page), `axe no painel, tema ${tema}`).toEqual([]);

      await botaoDesbloquear(page, ALVO).click();
      await expect(page.getByText(PERGUNTA_CONFIRMACAO)).toBeVisible();
      expect(await violacoesDoAxe(page), `axe na confirmação, tema ${tema}`).toEqual([]);
      await linhaDa(page, ALVO).locator('[data-acao="cancelar-desbloqueio"]').click();

      fundos.add(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
    }
    // O tema emulado chegou de fato: os dois temas têm fundo diferente.
    expect(fundos.size, 'o tema escuro difere do claro').toBe(2);
  });
}
