import { expect, test } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp, esperarEntrada } from './apoio/acoes';
import { CONTA_COMUM } from './apoio/constantes';
import { TITULAR } from '../../src/conteudo/sobre/autoria';

/**
 * SB-F6, parte e2e (plano da onda Sobre, noite.md, N7). A página /sobre é pública no caminho e fechada no conteúdo:
 * sem sessão, a resposta do servidor é a tela de entrada e não traz o nome do titular, nem na forma exata nem na
 * normalizada (sem acento, minúscula); com sessão, a página mostra o nome. O nome vem de autoria.ts em tempo de
 * execução: este arquivo não o escreve.
 *
 * Vermelho contra e06c40f (anterior à N2, cd393ec), onde a rota /sobre ainda não existe.
 */

function normalizado(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

test.beforeEach(() => resetarPrivado());

test('sobre: sem sessão, /sobre devolve a tela de entrada e o nome do titular não aparece', async ({
  page,
  request
}) => {
  const resposta = await request.get('/sobre');
  const corpo = await resposta.text();
  expect(corpo.includes(TITULAR), 'nome exato na resposta sem sessão').toBe(false);
  expect(normalizado(corpo).includes(normalizado(TITULAR)), 'nome normalizado na resposta sem sessão').toBe(
    false
  );

  await page.goto('/sobre');
  await esperarEntrada(page);
  await expect(page.locator('body')).not.toContainText(TITULAR);
});

test('sobre: com sessão, /sobre mostra o nome do titular', async ({ page }) => {
  await entrarNoApp(page, CONTA_COMUM, '/sobre');
  // O nome também aparece na rodapé de toda página logada, então o caso fecha na página Sobre: título e seção de autoria.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('section[aria-labelledby="sobre-autoria"]')).toContainText(TITULAR);
});
