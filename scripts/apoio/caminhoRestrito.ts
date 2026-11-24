import { resolve } from 'node:path';

/** Padrão do JSON restrito, relativo à raiz do repositório (fora do git, ao lado dele). */
export const CAMINHO_RESTRITO_PADRAO =
  '../site_direito2026_restrito/conteudo/interdisciplinar.json';

/**
 * Caminho do JSON do conteúdo restrito (RESTRITO-CAMINHO). A variável de ambiente vence quando tem
 * valor; vazia ou ausente cai no padrão relativo à raiz. Só resolve o caminho: não lê o arquivo.
 */
export function caminhoRestrito(valorDoAmbiente: string | undefined, raiz: string): string {
  const escolhido =
    valorDoAmbiente && valorDoAmbiente.length > 0 ? valorDoAmbiente : CAMINHO_RESTRITO_PADRAO;
  return resolve(raiz, escolhido);
}
