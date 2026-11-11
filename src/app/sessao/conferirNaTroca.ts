/** Intervalo mínimo entre duas conferências da sessão, na troca de página (plano 1.6, decisão R2 do líder). */
export const INTERVALO_CONFERENCIA_NA_TROCA_MS = 30_000;

export interface OpcoesConferirNaTroca {
  /** Confere a sessão no servidor; o retorno não é esperado pela troca de página. */
  readonly conferir: () => unknown;
  /** Relógio em milissegundos. Injetado para o teste da borda do intervalo. */
  readonly agora: () => number;
  readonly intervaloMs?: number;
}

/**
 * Devolve a função que a troca de página chama. Só a primeira chamada dentro de
 * cada janela de `intervaloMs` confere; chamadas barradas não reiniciam a janela,
 * que sempre conta desde a última conferência feita.
 */
export function criarConferirNaTroca(opcoes: OpcoesConferirNaTroca): () => void {
  const intervalo = opcoes.intervaloMs ?? INTERVALO_CONFERENCIA_NA_TROCA_MS;
  let ultimaConferencia: number | undefined;

  return () => {
    const agora = opcoes.agora();
    if (ultimaConferencia !== undefined && agora - ultimaConferencia < intervalo) return;
    ultimaConferencia = agora;
    opcoes.conferir();
  };
}
