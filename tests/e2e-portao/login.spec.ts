import { expect, test } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { capturar, entrarNoApp, esperarApp, esperarEntrada, preencherEntrada } from './apoio/acoes';
import {
  CONTA_ADMIN,
  CONTA_TROCA,
  DESTINO_INTERDISCIPLINAR,
  FRASE_RECUSA,
  SENHA_NOVA_TROCA
} from './apoio/constantes';

test.beforeEach(() => resetarPrivado());

test('usuário e senha errados mostram a frase exata, sem dizer qual dos dois está errado', async ({
  page
}) => {
  await page.goto('/');
  await esperarEntrada(page);

  await preencherEntrada(page, { usuario: CONTA_ADMIN.usuario, senha: 'senha-errada-sintetica' });
  await expect(page.getByRole('alert')).toHaveText(FRASE_RECUSA);
  await capturar(page, '02-frase-senha-errada');

  await page.locator('#usuario').fill('nao-existe-sintetico');
  await page.locator('#senha').fill(CONTA_ADMIN.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toHaveText(FRASE_RECUSA);
  await esperarEntrada(page);
});

test('login certo sem troca pendente leva ao app', async ({ page }) => {
  await entrarNoApp(page, CONTA_ADMIN, '/');
  await expect(page.getByRole('link', { name: 'Trocar senha' })).toBeVisible();
});

test('troca obrigatória bloqueia todo conteúdo até a senha ser trocada', async ({ page }) => {
  await page.goto('/');
  await esperarEntrada(page);
  await preencherEntrada(page, CONTA_TROCA);

  // A tela de troca é o único conteúdo: sem o app, sem o conteúdo restrito.
  await expect(page.getByText('Troca de senha obrigatória antes de continuar.')).toBeVisible();
  await expect(page.locator('#app')).toHaveCount(0);
  await capturar(page, '03-troca-obrigatoria');

  await page.goto(DESTINO_INTERDISCIPLINAR);
  await expect(page.getByText('Troca de senha obrigatória antes de continuar.')).toBeVisible();
  await expect(page.locator('#app')).toHaveCount(0);

  // page.request usa os cookies do próprio navegador (o request fixture é anônimo e não serve aqui).
  const bloqueado = await page.request.get('/api/conteudo.php', {
    headers: { Accept: 'application/json' }
  });
  expect(bloqueado.status()).toBe(403);
  expect(await bloqueado.text()).not.toContain('Bloco fictício');

  await page.locator('#senhaAtual').fill(CONTA_TROCA.senha);
  await page.locator('#senhaNova').fill(SENHA_NOVA_TROCA);
  await page.getByRole('button', { name: 'Trocar senha' }).click();
  await esperarApp(page);
});

test('depois da troca, a senha nova entra e a antiga é recusada', async ({ page }) => {
  await page.goto('/');
  await esperarEntrada(page);
  await preencherEntrada(page, CONTA_TROCA);
  await page.locator('#senhaAtual').fill(CONTA_TROCA.senha);
  await page.locator('#senhaNova').fill(SENHA_NOVA_TROCA);
  await page.getByRole('button', { name: 'Trocar senha' }).click();
  await esperarApp(page);

  await page.context().clearCookies();
  await page.goto('/');
  await esperarEntrada(page);
  await preencherEntrada(page, CONTA_TROCA);
  await expect(page.getByRole('alert')).toHaveText(FRASE_RECUSA);

  await page.locator('#usuario').fill(CONTA_TROCA.usuario);
  await page.locator('#senha').fill(SENHA_NOVA_TROCA);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Troca de senha obrigatória antes de continuar.')).toHaveCount(0);
  await esperarApp(page);
});

test('link profundo: quem não entrou e pede uma cadeira volta a ela depois do login', async ({
  page
}) => {
  await page.goto(DESTINO_INTERDISCIPLINAR);
  await esperarEntrada(page);
  await preencherEntrada(page, CONTA_ADMIN);
  await page.waitForURL(`**${DESTINO_INTERDISCIPLINAR}`);
  await esperarApp(page);
  expect(new URL(page.url()).pathname).toBe(DESTINO_INTERDISCIPLINAR);
});

test('limite: a 6ª tentativa seguida na mesma conta responde 429 com a frase e os segundos', async ({
  page
}) => {
  await page.goto('/');
  await esperarEntrada(page);
  let ultimaResposta = 0;
  for (let i = 0; i < 6; i++) {
    const resposta = page.waitForResponse((r) => r.url().includes('/api/acesso.php'));
    await preencherEntrada(page, { usuario: CONTA_ADMIN.usuario, senha: `senha-errada-${i}` });
    ultimaResposta = (await resposta).status();
    // A tela recarregada vem com o campo vazio; o valor preenchido antes só some na página nova.
    await expect(page.locator('#usuario')).toHaveValue('');
  }
  expect(ultimaResposta).toBe(429);
  await expect(page.getByRole('alert')).toHaveText(
    new RegExp(`^${FRASE_RECUSA} Aguarde \\d+ segundos\\.$`)
  );
});
