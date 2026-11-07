import { expect, test } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { capturar, entrarNoApp, esperarApp } from './apoio/acoes';
import {
  CONTA_COMUM,
  DESTINO_INTERDISCIPLINAR,
  DESTINO_JURI,
  ID_IMAGEM_SINTETICA,
  ORIGEM,
  TRECHO_CONTEUDO_INTERDISCIPLINAR
} from './apoio/constantes';

test.beforeEach(() => resetarPrivado());

test('Interdisciplinar abre com a sessão, sem pedir senha de novo', async ({ page }) => {
  await entrarNoApp(page, CONTA_COMUM, DESTINO_INTERDISCIPLINAR);
  await esperarApp(page);
  expect(new URL(page.url()).pathname).toBe(DESTINO_INTERDISCIPLINAR);
  await expect(
    page.getByText(TRECHO_CONTEUDO_INTERDISCIPLINAR, { exact: false }).first()
  ).toBeVisible();
  await capturar(page, '04-interdisciplinar');
});

test('Júri abre com a sessão, sem pedir senha de novo, e o conteúdo da API chega', async ({
  page
}) => {
  await entrarNoApp(page, CONTA_COMUM, DESTINO_JURI);
  await esperarApp(page);
  expect(new URL(page.url()).pathname).toBe(DESTINO_JURI);
  const conteudo = await page.request.get(`${ORIGEM}/api/juri/conteudo.php`, {
    headers: { Accept: 'application/json' }
  });
  expect(conteudo.status()).toBe(200);
});

test('imagem da Júri: sem sessão responde 401; com sessão, PNG em claro', async ({
  page,
  request
}) => {
  const anonima = await request.get(`${ORIGEM}/api/juri/imagem.php?id=${ID_IMAGEM_SINTETICA}`);
  expect(anonima.status()).toBe(401);
  expect(anonima.headers()['content-type']).not.toBe('image/png');
  expect((await anonima.body()).subarray(0, 8).toString('hex')).not.toBe('89504e470d0a1a0a');

  await entrarNoApp(page, CONTA_COMUM, DESTINO_JURI);
  const imagem = await page.request.get(`${ORIGEM}/api/juri/imagem.php?id=${ID_IMAGEM_SINTETICA}`);
  expect(imagem.status()).toBe(200);
  expect(imagem.headers()['content-type']).toBe('image/png');
  expect((await imagem.body()).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
});
