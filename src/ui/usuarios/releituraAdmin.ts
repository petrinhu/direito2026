/** Intervalo mínimo entre duas leituras da lista do admin (volta da aba ou botão Atualizar), em ms. */
export const INTERVALO_RELEITURA_MS = 30_000;

/** A volta da aba só relê se já passou o intervalo desde a última leitura. */
export function podeReler(agora: number, ultimaLeitura: number): boolean {
  return agora - ultimaLeitura >= INTERVALO_RELEITURA_MS;
}
