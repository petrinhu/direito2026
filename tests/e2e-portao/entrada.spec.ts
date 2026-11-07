import { expect, test } from '@playwright/test';
import { chaveAssetJs, resetarPrivado } from './apoio/ambiente';
import { capturar, esperarEntrada } from './apoio/acoes';
import { DESTINO_INTERDISCIPLINAR, DESTINO_JURI, ORIGEM } from './apoio/constantes';

test.beforeEach(() => resetarPrivado());

test('anônimo que abre qualquer rota vê só a tela de entrada, nunca o app', async ({ page }) => {
  const rotas = [
    '/',
    DESTINO_INTERDISCIPLINAR,
    DESTINO_JURI,
    '/calendario',
    '/busca',
    '/usuarios',
    '/conta'
  ];
  for (const rota of rotas) {
    const resposta = await page.goto(rota);
    expect(resposta?.status(), `status de ${rota}`).toBe(200);
    await esperarEntrada(page);
    const texto = (await page.locator('body').innerText()).toLowerCase();
    expect(texto, `texto de ${rota} sem conteúdo do app`).not.toContain('interdisciplinar');
    expect(texto, `texto de ${rota} sem menu`).not.toContain('gerenciar usuários');
  }
  await capturar(page, '01-entrada');
});

test('a tela de entrada vai com o caminho pedido no destino oculto, para voltar depois do login', async ({
  page
}) => {
  await page.goto(DESTINO_INTERDISCIPLINAR);
  await esperarEntrada(page);
  await expect(page.locator('input[name="destino"]')).toHaveValue(DESTINO_INTERDISCIPLINAR);
  await expect(page.locator('form')).toHaveAttribute('action', '/api/acesso.php');
});

test('asset anônimo responde 401 sem corpo (o portão não entrega nenhum byte do app)', async ({
  request
}) => {
  const resposta = await request.get(`${ORIGEM}/${chaveAssetJs()}`, { headers: { Accept: '*/*' } });
  expect(resposta.status()).toBe(401);
  expect((await resposta.body()).length).toBe(0);
  expect(resposta.headers()['cache-control']).toBe('private, no-store');
});

test('API de conteúdo anônima responde 401 e não devolve conteúdo', async ({ request }) => {
  const conteudo = await request.get(`${ORIGEM}/api/conteudo.php`);
  expect(conteudo.status()).toBe(401);
  expect(await conteudo.text()).not.toContain('Bloco fictício');
  const juri = await request.get(`${ORIGEM}/api/juri/conteudo.php`);
  expect(juri.status()).toBe(401);
});

test('a tela de entrada não carrega script e sai com CSP fechada (default-src none)', async ({
  page
}) => {
  const resposta = await page.goto('/');
  expect(resposta?.headers()['content-security-policy']).toContain("default-src 'none'");
  expect(resposta?.headers()['x-frame-options']).toBe('DENY');
  await expect(page.locator('script')).toHaveCount(0);
});
