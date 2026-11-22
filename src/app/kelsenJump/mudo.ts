/** Chave do mudo do jogo no localStorage, no mesmo prefixo do resto do site. */
const CHAVE_MUDO = 'caderno-direito:v1:kelsen-jump:mudo';

/** Lê o estado do mudo. Sem acesso ao armazenamento (modo privado, cota, bloqueio), vale "com som". */
export function lerMudo(): boolean {
  try {
    return globalThis.localStorage?.getItem(CHAVE_MUDO) === '1';
  } catch {
    return false;
  }
}

/** Grava o estado do mudo. Falha de armazenamento não quebra o jogo: só deixa de lembrar a escolha. */
export function gravarMudo(mudo: boolean): void {
  try {
    globalThis.localStorage?.setItem(CHAVE_MUDO, mudo ? '1' : '0');
  } catch {
    // Sem armazenamento, a escolha vale só para a página aberta.
  }
}
