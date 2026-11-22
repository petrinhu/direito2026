/**
 * Recorde pessoal do Kelsen Jump, guardado no navegador como o mudo: uma chave própria do jogo, no
 * prefixo do site. Assim o "apagar tudo" do site (RepositorioLocalStorage.limparTudo) já o leva junto.
 * Sem armazenamento (bloqueado, cota, modo privado), o jogo segue sem recorde: lê 0 e não grava.
 */
const CHAVE_RECORDE = 'caderno-direito:v1:kelsen-jump:recorde';

export interface ResultadoRecorde {
  /** Recorde depois da comparação: a pontuação nova se bateu, senão o que já existia. */
  readonly recorde: number;
  /** Verdadeiro só se a pontuação passou do recorde anterior (empate não conta). */
  readonly bateu: boolean;
}

/** Compara a pontuação do fim de partida com o recorde guardado. Pura: não toca no armazenamento. */
export function compararRecorde(recordeAtual: number, pontuacao: number): ResultadoRecorde {
  const base = Number.isSafeInteger(recordeAtual) && recordeAtual > 0 ? recordeAtual : 0;
  const nova = Number.isSafeInteger(pontuacao) && pontuacao > 0 ? pontuacao : 0;
  return nova > base ? { recorde: nova, bateu: true } : { recorde: base, bateu: false };
}

/** Lê o recorde guardado. Valor ausente, ilegível ou sem armazenamento vale 0. */
export function lerRecorde(): number {
  try {
    const bruto = globalThis.localStorage?.getItem(CHAVE_RECORDE) ?? '';
    if (!/^\d+$/.test(bruto)) return 0;
    const valor = Number(bruto);
    return Number.isSafeInteger(valor) ? valor : 0;
  } catch {
    return 0;
  }
}

/** Grava o recorde. Falha de armazenamento não quebra o jogo: a partida segue, só não fica salva. */
export function gravarRecorde(recorde: number): boolean {
  try {
    const armazenamento = globalThis.localStorage;
    if (!armazenamento) return false;
    armazenamento.setItem(CHAVE_RECORDE, String(recorde));
    return true;
  } catch {
    return false;
  }
}
