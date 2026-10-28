import type { Page } from '@playwright/test';
import {
  criarServidorJuriFalso,
  type ServidorJuriFalso
} from '../../unidade/apoio/servidorJuriFalso';

/** Conta sintética (L-28): nenhum nome, senha ou dado real do caso. */
export const USUARIO_JURI_FALSO = 'admin';
export const SENHA_PROVISORIA_FALSA = 'provisoria-sintetica-de-teste';

export interface OpcoesJuriFalsa {
  /** Senha da conta falsa. Default: a provisória (que pede troca). */
  readonly senha?: string;
  /** Default true: conta na troca obrigatória, como no primeiro acesso. */
  readonly deveTrocarSenha?: boolean;
}

/**
 * API da Júri em memória, atrás de page.route. O servidor falso do teste unitário
 * responde com as mesmas regras do backend (corpo exato, CSRF, 401 por código), e o
 * navegador faz a criptografia de verdade: o embrulho só abre com a senha certa.
 * Devolve o servidor para o teste conferir o que chegou a ele (chamadasPara).
 * Sem opções, a conta começa em troca pendente, como no primeiro acesso.
 */
export async function prepararJuriFalsa(
  page: Page,
  opcoes: OpcoesJuriFalsa = {}
): Promise<ServidorJuriFalso> {
  const servidor = criarServidorJuriFalso();
  await servidor.criarConta(
    USUARIO_JURI_FALSO,
    opcoes.senha ?? SENHA_PROVISORIA_FALSA,
    opcoes.deveTrocarSenha ?? true
  );
  await page.route('**/api/juri/**', async (rota) => {
    const pedido = rota.request();
    // O Playwright entrega os cabeçalhos em minúsculas; o servidor falso lê X-CSRF-Token.
    const csrf = (await pedido.allHeaders())['x-csrf-token'];
    const resposta = await servidor.buscar(pedido.url(), {
      method: pedido.method(),
      headers: csrf === undefined ? {} : { 'X-CSRF-Token': csrf },
      body: pedido.postData() ?? undefined
    });
    // Bytes, não texto: imagem.php devolve o arquivo cifrado, que não é UTF-8.
    await rota.fulfill({
      status: resposta.status,
      contentType: resposta.headers.get('content-type') ?? 'application/json',
      body: Buffer.from(await resposta.arrayBuffer())
    });
  });
  return servidor;
}
