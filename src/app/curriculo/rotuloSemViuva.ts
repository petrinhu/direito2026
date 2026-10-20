/** Palavra final com até este número de caracteres é tratada como "solta" (ex.: "1", "II"). */
const TAMANHO_MAXIMO_PALAVRA_SOLTA = 3;

/**
 * Evita viúva tipográfica: a última palavra curta de um rótulo ("1", "II")
 * sozinha na linha de baixo quando o texto quebra. Troca o último espaço por
 * U+00A0 (espaço não separável), então a penúltima e a última palavra nunca
 * se separam. Determinístico: não depende de suporte a text-wrap do navegador.
 */
export function rotuloSemViuva(texto: string): string {
  const ultimoEspaco = texto.lastIndexOf(' ');
  if (ultimoEspaco === -1) return texto;
  const ultimaPalavra = texto.slice(ultimoEspaco + 1);
  if (ultimaPalavra.length === 0 || ultimaPalavra.length > TAMANHO_MAXIMO_PALAVRA_SOLTA) {
    return texto;
  }
  return `${texto.slice(0, ultimoEspaco)} ${ultimaPalavra}`;
}
