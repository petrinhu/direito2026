import type { Page } from '@playwright/test';
import {
  criarServidorJuriFalso,
  type ServidorJuriFalso
} from '../../unidade/apoio/servidorJuriFalso';

/** Conta sintética (L-28): nenhum nome, senha ou dado real do caso. */
export const USUARIO_JURI_FALSO = 'admin';
export const SENHA_PROVISORIA_FALSA = 'provisoria-sintetica-de-teste';

/**
 * API da Júri em memória, atrás de page.route. O servidor falso do teste unitário
 * responde com as mesmas regras do backend (corpo exato, CSRF, 401 por código), e o
 * navegador faz a criptografia de verdade: o embrulho só abre com a senha certa.
 * Devolve o servidor para o teste conferir o que chegou a ele (chamadasPara).
 * Começa com a conta em troca pendente, como no primeiro acesso.
 */
export async function prepararJuriFalsa(page: Page): Promise<ServidorJuriFalso> {
  const servidor = criarServidorJuriFalso();
  await servidor.criarConta(USUARIO_JURI_FALSO, SENHA_PROVISORIA_FALSA, true);
  await page.route('**/api/juri/**', async (rota) => {
    const pedido = rota.request();
    // O Playwright entrega os cabeçalhos em minúsculas; o servidor falso lê X-CSRF-Token.
    const csrf = (await pedido.allHeaders())['x-csrf-token'];
    const resposta = await servidor.buscar(pedido.url(), {
      method: pedido.method(),
      headers: csrf === undefined ? {} : { 'X-CSRF-Token': csrf },
      body: pedido.postData() ?? undefined
    });
    await rota.fulfill({
      status: resposta.status,
      contentType: 'application/json',
      body: await resposta.text()
    });
  });
  return servidor;
}
