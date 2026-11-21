/**
 * Decide se a busca no texto integral deve rodar para o termo (EP-F11-BUSCA-
 * TETO). Só dispara quando a busca principal não acha nada: o índice do texto
 * integral é baixado sob demanda, e sem resultado principal não há o que poupar.
 */
export function deveBuscarNoTextoIntegral(
  termo: string,
  quantidadeResultadosPrincipais: number
): boolean {
  return termo.trim() !== '' && quantidadeResultadosPrincipais === 0;
}
