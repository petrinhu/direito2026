import { appendFileSync, readFileSync } from 'node:fs';
import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

// Robô do E2E no ar (V17-F3). Cada modo é uma rodada de scripts/e2e-ar.sh: base, pre ou pos.
// Segredos: lidos do arquivo em E2E_AR_SEGREDO (modo 600). Nunca vêm de argumento nem de variável.
// Falhas: asserções sobre booleanos com mensagem fixa, para que o valor digitado não entre no relatório.

const SEGREDO = process.env.E2E_AR_SEGREDO ?? '';
const MODO = process.env.E2E_AR_MODO ?? '';
const BASE = process.env.E2E_AR_BASE ?? '';
const PASSO = process.env.E2E_AR_PASSO ?? '';

/** Valor obrigatório do segredo. Falha pelo nome da chave, nunca pelo valor. */
function exigir(achado: Readonly<Record<string, string>>, chave: string): string {
  const valor = achado[chave];
  if (valor === undefined) throw new Error(`segredo sem a chave ${chave}`);
  return valor;
}

function segredo(): Record<string, string> {
  const achado: Record<string, string> = {};
  for (const linha of readFileSync(SEGREDO, 'utf8').split('\n')) {
    const i = linha.indexOf('=');
    if (i > 0) achado[linha.slice(0, i)] = linha.slice(i + 1);
  }
  return achado;
}

/** Anota o passo para o script saber onde a rodada está (parada de propósito e falha de preparo). */
function passo(nome: string): void {
  if (PASSO) appendFileSync(PASSO, `${nome}\n`);
}

/** Acrescenta uma linha ao segredo (lida como último valor pelo script). Só para o que a próxima rodada precisa. */
function guardar(chave: string, valor: string): void {
  appendFileSync(SEGREDO, `${chave}=${valor}\n`);
}

async function entrar(page: Page, usuario: string, senha: string): Promise<void> {
  await page.locator('#usuario').fill(usuario);
  await page.locator('#senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

/** Primeiro acesso da administradora do robô: a senha inicial pede troca antes do painel. */
async function trocarSenhaObrigatoria(page: Page, atual: string, nova: string): Promise<void> {
  await expect(page.locator('#senhaNova')).toBeVisible();
  await page.locator('#senhaAtual').fill(atual);
  await page.locator('#senhaNova').fill(nova);
  await page.getByRole('button', { name: 'Trocar senha' }).click();
  await expect(page.locator('#app')).toHaveCount(1);
}

/** Cria a conta pelo formulário "Novo usuário" e devolve o caminho do convite que o painel mostrou. */
async function criarPeloPainel(page: Page, usuario: string, email: string): Promise<string> {
  await page.goto(`${BASE}/usuarios`);
  await page.locator('input[name="novoUsuario"]').fill(usuario);
  await page.locator('input[name="novoEmail"]').fill(email);
  const [resposta] = await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/usuarios.php'
    ),
    page.getByRole('button', { name: 'Criar usuário' }).click()
  ]);
  const corpo = (await resposta.json()) as { convite?: string };
  return corpo.convite ?? '';
}

/** Abre o convite numa pessoa nova (outro aparelho, sem sessão), cria a senha e fica logada. */
async function criarSenhaPeloConvite(
  browser: Browser,
  convite: string,
  senha: string
): Promise<{ contexto: BrowserContext; page: Page }> {
  const contexto = await browser.newContext();
  const page = await contexto.newPage();
  await page.goto(`${BASE}${convite}`);
  await expect(page.locator('#senhaNova')).toBeVisible();
  await page.locator('#senhaNova').fill(senha);
  await page.locator('#senhaRepetida').fill(senha);
  await page.getByRole('button', { name: 'Criar senha e entrar' }).click();
  await expect(page.locator('#app')).toHaveCount(1);
  return { contexto, page };
}

async function sair(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.locator('#senha')).toBeVisible();
}

/** Exclui a conta pelo painel. Se o painel pedir confirmação por caixa nativa, a aceita. */
async function excluirPeloPainel(page: Page, usuario: string): Promise<void> {
  await page.goto(`${BASE}/usuarios`);
  await page
    .locator('tbody tr', { hasText: usuario })
    .getByRole('button', { name: `Excluir ${usuario}` })
    .click();
  // A confirmação é um grupo dentro da própria página, não uma caixa nativa.
  await page
    .getByRole('group', { name: `Confirmar exclusão de ${usuario}` })
    .getByRole('button', { name: 'Excluir', exact: true })
    .click();
  await expect(page.locator('tbody tr', { hasText: usuario })).toHaveCount(0);
}

function tokenDoConvite(convite: string): string {
  const achado = /[?#]t=([0-9a-f]{64})$/.exec(convite);
  return achado?.[1] ?? '';
}

/** Item 7 da 3.6 na tela do aluno: troca de senha em /conta (a nova é a atual invertida, 48 caracteres,
 * diferente da atual e dentro de 15 a 128), abas da unidade e imagens da unidade. */
async function conferirTelaDoAluno(page: Page, senhaAtual: string): Promise<void> {
  const nova = [...senhaAtual].reverse().join('');
  await page.goto(`${BASE}/conta`);
  await page.getByLabel('Senha atual').fill(senhaAtual);
  await page.getByLabel('Nova senha', { exact: true }).fill(nova);
  await page.getByLabel('Confirmar nova senha').fill(nova);
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Senha trocada. A nova senha vale a partir de agora.' }),
    'a troca de senha confirmou na região de status'
  ).toBeVisible();
  await page.goto(`${BASE}/p/p1/intr-direito/u1`);
  await expect(
    page.getByRole('tablist', { name: 'Abas da unidade' }),
    'a unidade mostra as abas'
  ).toBeVisible();
  const imagens = page.locator('img');
  const total = await imagens.count();
  expect(total, 'a unidade tem pelo menos uma imagem').toBeGreaterThan(0);
  for (let i = 0; i < total; i++) {
    const imagem = imagens.nth(i);
    // Imagem fora da primeira dobra ou com loading="lazy" só baixa ao entrar na tela.
    await imagem.scrollIntoViewIfNeeded();
    const src = (await imagem.getAttribute('src')) ?? '';
    const caminho = src.split(/[?#]/)[0] || '(sem src)';
    await expect
      .poll(
        () =>
          imagem.evaluate((e) => {
            const img = e as { complete?: boolean; naturalWidth?: number };
            return img.complete === true && Number(img.naturalWidth ?? 0) > 0;
          }),
        { message: `a imagem da unidade carregou: ${caminho}`, timeout: 15_000 }
      )
      .toBe(true);
  }
}

/** Item 7 da 3.6 no painel: o LED do aluno está verde (sessão aberta) e o último acesso tem data e hora. */
async function conferirPainelDoAluno(pa: Page, usuario: string): Promise<void> {
  await pa.goto(`${BASE}/usuarios`);
  const linha = pa.locator('tbody tr', { hasText: usuario });
  await expect(linha.locator('.ar-led--verde'), 'o LED do aluno está verde').toHaveCount(1);
  const ultimo = (await linha.locator('td[data-rotulo="Último acesso"]').textContent()) ?? '';
  expect(
    /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(ultimo),
    'o último acesso tem data e hora'
  ).toBe(true);
}

/** Sair e depois Voltar: o histórico não pode mostrar o site depois de sair. */
async function sairEVoltar(page: Page): Promise<void> {
  await sair(page);
  await page.goBack();
  await expect(page.locator('#app'), 'o Voltar depois de sair não mostra o site').toHaveCount(0);
}

test.describe('robô do e2e no ar', () => {
  test.skip(!SEGREDO || !BASE, 'sem segredo ou base: rode por scripts/e2e-ar.sh');

  test('base: a administradora cria o aluno pelo painel, o aluno cria a senha, entra, sai e o painel o exclui', async ({
    browser
  }) => {
    test.skip(MODO !== 'base', 'rodada de outro modo');
    const s = segredo();
    const admin = await browser.newContext();
    const pa = await admin.newPage();

    passo('primeiro-get');
    await pa.goto(`${BASE}/`);
    await expect(pa.locator('#senha')).toBeVisible();
    await entrar(pa, exigir(s, 'ADM_LOGIN'), exigir(s, 'ADM_SENHA_INICIAL'));
    await trocarSenhaObrigatoria(pa, exigir(s, 'ADM_SENHA_INICIAL'), exigir(s, 'ADM_SENHA_NOVA'));

    const convite = await criarPeloPainel(pa, exigir(s, 'ALUNO_LOGIN'), exigir(s, 'ALUNO_EMAIL'));
    // A caixa de base roda o produto 924591f, que ainda emite ?t= (link antigo). O formato novo é #t=.
    expect(
      /^\/api\/convite\.php(\?t=|#t=)[0-9a-f]{64}$/.test(convite),
      'o painel devolveu o convite em um dos dois formatos'
    ).toBe(true);
    passo('aluno-criado');

    const { contexto: aluno, page: pagAluno } = await criarSenhaPeloConvite(
      browser,
      convite,
      exigir(s, 'ALUNO_SENHA')
    );
    expect(new URL(pagAluno.url()).hash, 'a barra perdeu o fragmento depois do convite').toBe('');
    await conferirTelaDoAluno(pagAluno, exigir(s, 'ALUNO_SENHA'));
    await conferirPainelDoAluno(pa, exigir(s, 'ALUNO_LOGIN'));
    await sairEVoltar(pagAluno);
    await aluno.close();
    passo('aluno-saiu');

    await excluirPeloPainel(pa, exigir(s, 'ALUNO_LOGIN'));
    passo('aluno-excluido');
    await sair(pa);
    await admin.close();
  });

  test('pre: cria o aluno pendente que atravessa o publicar, guarda o link antigo (?t=) e sai', async ({
    browser
  }) => {
    test.skip(MODO !== 'pre', 'rodada de outro modo');
    const s = segredo();
    const admin = await browser.newContext();
    const pa = await admin.newPage();

    passo('primeiro-get');
    await pa.goto(`${BASE}/`);
    await expect(pa.locator('#senha')).toBeVisible();
    await entrar(pa, exigir(s, 'ADM_LOGIN'), exigir(s, 'ADM_SENHA_INICIAL'));
    await trocarSenhaObrigatoria(pa, exigir(s, 'ADM_SENHA_INICIAL'), exigir(s, 'ADM_SENHA_NOVA'));

    const convite = await criarPeloPainel(pa, exigir(s, 'ALUNO_LOGIN'), exigir(s, 'ALUNO_EMAIL'));
    const token = tokenDoConvite(convite);
    expect(token.length, 'o painel devolveu um token de 64 caracteres').toBe(64);
    guardar('ALUNO_LINK_ANTIGO', `${BASE}/api/convite.php?t=${token}`);
    passo('aluno-pendente-criado');

    await sair(pa);
    await admin.close();
  });

  test('pos: o aluno do link antigo recebe a senha pelo 303; o painel troca o aluno e o novo convite sai em #t=', async ({
    browser
  }) => {
    test.skip(MODO !== 'pos', 'rodada de outro modo');
    const s = segredo();

    // 1) O link antigo responde 303 para o fragmento, sem seguir o redirect aqui.
    passo('primeiro-get');
    const contexto = await browser.newContext();
    const pAntigo = await contexto.newPage();
    const resposta = await pAntigo.request.get(exigir(s, 'ALUNO_LINK_ANTIGO'), { maxRedirects: 0 });
    expect(resposta.status(), 'o link antigo responde 303').toBe(303);
    const destino = resposta.headers()['location'] ?? '';
    expect(destino.startsWith('/api/convite.php#t='), 'o 303 vai para o fragmento #t=').toBe(true);

    // 2) A pessoa abre o link antigo, cria a senha e entra.
    await pAntigo.goto(exigir(s, 'ALUNO_LINK_ANTIGO'));
    await expect(pAntigo.locator('#senhaNova')).toBeVisible();
    await pAntigo.locator('#senhaNova').fill(exigir(s, 'ALUNO_SENHA'));
    await pAntigo.locator('#senhaRepetida').fill(exigir(s, 'ALUNO_SENHA'));
    await pAntigo.getByRole('button', { name: 'Criar senha e entrar' }).click();
    await expect(pAntigo.locator('#app')).toHaveCount(1);
    expect(new URL(pAntigo.url()).hash, 'a barra perdeu o fragmento depois do link antigo').toBe(
      ''
    );
    await sair(pAntigo);
    await contexto.close();
    passo('aluno-antigo-entrou');

    // 3) A administradora do robô exclui o aluno antigo e cria o novo, com o mesmo e-mail.
    const admin = await browser.newContext();
    const pa = await admin.newPage();
    await pa.goto(`${BASE}/`);
    await expect(pa.locator('#senha')).toBeVisible();
    await entrar(pa, exigir(s, 'ADM_LOGIN'), exigir(s, 'ADM_SENHA_INICIAL'));
    await trocarSenhaObrigatoria(pa, exigir(s, 'ADM_SENHA_INICIAL'), exigir(s, 'ADM_SENHA_NOVA'));
    await excluirPeloPainel(pa, exigir(s, 'ALUNO_LOGIN'));
    passo('aluno-antigo-excluido');

    const convite = await criarPeloPainel(
      pa,
      exigir(s, 'ALUNO_NOVO_LOGIN'),
      exigir(s, 'ALUNO_EMAIL')
    );
    expect(convite.startsWith('/api/convite.php#t='), 'o convite novo sai no formato #t=').toBe(
      true
    );
    expect(convite.includes('?t='), 'o convite novo não traz ?t=').toBe(false);
    guardar('ALUNO_NOVO_LINK', `${BASE}${convite}`);
    passo('aluno-novo-criado');

    // 4) O aluno novo cria a senha pelo #t=, entra, sai.
    const { contexto: novo, page: pNovo } = await criarSenhaPeloConvite(
      browser,
      convite,
      exigir(s, 'ALUNO_NOVO_SENHA')
    );
    expect(new URL(pNovo.url()).hash, 'a barra perdeu o fragmento no convite novo').toBe('');
    await conferirTelaDoAluno(pNovo, exigir(s, 'ALUNO_NOVO_SENHA'));
    await conferirPainelDoAluno(pa, exigir(s, 'ALUNO_NOVO_LOGIN'));
    await sairEVoltar(pNovo);
    await novo.close();
    passo('aluno-novo-saiu');

    await sair(pa);
    await admin.close();
  });
});
