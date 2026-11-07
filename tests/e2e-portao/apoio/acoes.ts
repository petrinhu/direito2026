import { expect, type Page } from '@playwright/test';
import { PASTA_CAPTURAS } from './constantes';

/** Dados de login sintéticos (constantes.ts). */
export interface ContaTeste {
  readonly usuario: string;
  readonly senha: string;
}

/** Espera a tela de entrada do portão: formulário presente e nenhum byte do app na página. */
export async function esperarEntrada(page: Page): Promise<void> {
  await expect(page.locator('#senha')).toBeVisible();
  await expect(page.locator('#app')).toHaveCount(0);
}

/** Espera o app: a casca do SPA montada e nenhuma tela de senha. */
export async function esperarApp(page: Page): Promise<void> {
  await expect(page.locator('#app')).toHaveCount(1);
  await expect(page.locator('#app')).not.toBeEmpty();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
}

/**
 * Preenche a tela de entrada e envia. Não espera o resultado: quem chama decide o que esperar
 * (sucesso leva ao destino, falha fica na mesma tela com a frase).
 */
export async function preencherEntrada(page: Page, conta: ContaTeste): Promise<void> {
  await page.locator('#usuario').fill(conta.usuario);
  await page.locator('#senha').fill(conta.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

/** Abre um caminho, preenche a entrada e espera o app no destino (login feliz). */
export async function entrarNoApp(page: Page, conta: ContaTeste, caminho = '/'): Promise<void> {
  await page.goto(caminho);
  await esperarEntrada(page);
  await preencherEntrada(page, conta);
  await esperarApp(page);
}

/** Captura de tela de página inteira do viewport (só o conteúdo do site; L-13, L-28). */
export async function capturar(page: Page, nome: string): Promise<void> {
  await page.screenshot({ path: `${PASTA_CAPTURAS}/${nome}.png` });
}
