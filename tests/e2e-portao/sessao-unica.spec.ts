import AxeBuilder from '@axe-core/playwright';
import { devices, expect, test, type Browser, type Page } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { capturar, entrarNoApp, esperarApp, esperarEntrada, preencherEntrada } from './apoio/acoes';
import { CONTA_ADMIN, CONTA_COMUM, ORIGEM, SENHA_NOVA_TROCA } from './apoio/constantes';

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
  let falhaDeLeitura: Error | undefined;
  let liberar: () => void = () => undefined;
  const lido = new Promise<void>((resolver) => {
    liberar = resolver;
  });
  await page.route(
    '**/api/sessao.php',
    async (rota) => {
      const resposta = await rota.fetch();
      try {
        corpo = await resposta.json();
      } catch (erro) {
        const motivo = erro instanceof Error ? erro.message : String(erro);
        falhaDeLeitura = new Error(
          `o corpo de /api/sessao.php (status ${resposta.status()}) não pôde ser lido como JSON: ${motivo}`
        );
      }
      await rota.fulfill({ response: resposta });
      liberar();
    },
    { times: 1 }
  );
  await trocarPaginaPeloMenu(page, nome);
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    temporizador = setTimeout(
      () => rejeitar(new Error('a troca não chamou /api/sessao.php a tempo')),
      TEMPO_ESPERA_CONFERENCIA_MS
    );
  });
  try {
    await Promise.race([lido, limite]);
  } finally {
    clearTimeout(temporizador);
  }
  if (falhaDeLeitura) throw falhaDeLeitura;
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

    // O último a entrar agora é A: A entra de novo e volta ao mesmo endereço.
    await preencherEntrada(page, CONTA_ADMIN);
    await esperarApp(page);
    await expect(page).toHaveURL(/\/calendario$/);
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

/**
 * SU-F2: o aparelho derrubado que, em vez de trocar de página, ENVIA um formulário. O servidor confere o CSRF
 * antes da conta, então a resposta é 403 `csrf` (e não 401), e o app tem de levar a pessoa à tela de entrada
 * com o aviso, como faz com o 401. Sem navegação nem recarga em A depois de B entrar: a conferência da troca
 * de página não pode ser a causa da queda. Cada teste derruba uma conta uma única vez (o POST do derrubado
 * conta uso simultâneo, e uma segunda queda poderia trocar o aviso por bloqueio).
 *
 * A ordem das asserções importa: A cai (entrada + aviso), B segue autenticado (leitura dentro da página,
 * sem navegar), e só no fim A entra de novo, o que derruba B.
 */

/** B lê a própria sessão por dentro da página, sem navegar: ela segue autenticada. */
async function exigirAutenticada(page: Page, rotulo: string): Promise<void> {
  const corpo = await page.evaluate(async () => {
    const resposta = await fetch('/api/sessao.php', { cache: 'no-store' });
    return (await resposta.json()) as { autenticado: boolean };
  });
  expect(corpo.autenticado, rotulo).toBe(true);
}

test('sessão única: derrubado que envia a troca de senha volta à tela de entrada com o aviso', async ({
  page,
  browser
}) => {
  await page.clock.install();
  // A página de troca tem campos de senha, que o `esperarApp` não aceita: entra pela raiz e vai pelo menu.
  await entrarNoApp(page, CONTA_ADMIN, '/');
  await trocarPaginaPeloMenu(page, 'Trocar senha');
  await expect(page.getByRole('heading', { name: 'Trocar senha', level: 1 })).toBeVisible();

  const aparelhoB = await abrirAparelho(browser);
  try {
    await entrarNoApp(aparelhoB.page, CONTA_ADMIN, '/');
    await expect(aparelhoB.page.locator('#app')).not.toBeEmpty();

    // A segue na página, sem aviso nenhum ainda: só o envio vai ao servidor.
    await esperarNoApp(page);
    await page.getByLabel('Senha atual').fill(CONTA_ADMIN.senha);
    await page.getByLabel('Nova senha', { exact: true }).fill(SENHA_NOVA_TROCA);
    await page.getByLabel('Confirmar nova senha').fill(SENHA_NOVA_TROCA);
    await page.getByRole('button', { name: 'Salvar nova senha' }).click();

    await esperarEntrada(page);
    await expect(page.getByRole('alert')).toHaveText(TEXTO_AVISO);
    await expect(page).toHaveURL(/\/conta$/);

    await exigirAutenticada(aparelhoB.page, 'B segue autenticado depois da queda de A');

    // Nada foi gravado: a senha antiga ainda entra (e derruba B, por isso é a última coisa).
    await preencherEntrada(page, CONTA_ADMIN);
    await esperarNoApp(page);
    await expect(page).toHaveURL(/\/conta$/);
  } finally {
    await aparelhoB.fechar();
  }
});

test('sessão única: administrador derrubado que aciona o painel volta à tela de entrada e nada é gravado', async ({
  page,
  browser
}) => {
  await page.clock.install();
  await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
  const botaoRedefinir = page.locator(
    `button[data-acao="redefinir"][data-usuario="${CONTA_COMUM.usuario}"]`
  );
  await expect(botaoRedefinir).toBeVisible();

  const aparelhoB = await abrirAparelho(browser);
  try {
    await entrarNoApp(aparelhoB.page, CONTA_ADMIN, '/');
    await expect(aparelhoB.page.locator('#app')).not.toBeEmpty();

    await esperarNoApp(page);
    await botaoRedefinir.click();

    await esperarEntrada(page);
    await expect(page.getByRole('alert')).toHaveText(TEXTO_AVISO);
    await expect(page).toHaveURL(/\/usuarios$/);

    await exigirAutenticada(aparelhoB.page, 'B segue autenticado depois da queda de A');
    const convite = await aparelhoB.page.evaluate(async (usuario) => {
      const resposta = await fetch('/api/usuarios.php', { cache: 'no-store' });
      const corpo = (await resposta.json()) as {
        usuarios: { usuario: string; convite: string | null }[];
      };
      return corpo.usuarios.find((u) => u.usuario === usuario)?.convite;
    }, CONTA_COMUM.usuario);
    expect(convite ?? null, 'a conta alvo não ganhou convite novo').toBeNull();

    await preencherEntrada(page, CONTA_ADMIN);
    await esperarApp(page);
  } finally {
    await aparelhoB.fechar();
  }
});
