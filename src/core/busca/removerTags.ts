/**
 * Reduz HTML confiável a texto puro, sem depender de DOM (roda em Node, no
 * script de geração do índice, e também no navegador se precisar).
 *
 * Regra de codificação do guia de compatibilidade, seção 9: nada de
 * lookbehind nem lookahead negativo (Safari só ganhou lookbehind na versão
 * 16.4). As duas expressões abaixo usam só classes de caractere simples.
 */
export function removerTags(html: string): string {
  const semTags = html.replace(/<[^>]*>/g, ' ');
  const espacosColapsados = semTags.replace(/\s+/g, ' ').trim();
  // A tag fechada deixa um espaço antes da pontuação que a seguia no
  // original (ex.: "...Civil </button>." vira "...Civil ."). Sem
  // lookbehind: casa o espaço e a pontuação juntos, devolve só a pontuação.
  return espacosColapsados.replace(/ ([.,;:!?])/g, '$1');
}
