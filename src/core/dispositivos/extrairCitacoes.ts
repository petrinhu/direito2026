/**
 * Extrai os ids de `data-dispositivo="..."` de um trecho de HTML confiável.
 * Usado pelo script de geração do subconjunto por unidade (seção 12.5) e
 * pelo portão de verificação (seção 14). Sem DOM: regex simples, sem
 * lookbehind (guia de compatibilidade, seção 9).
 */
export function extrairCitacoes(html: string): string[] {
  const encontrados = html.match(/data-dispositivo="[^"]+"/g) ?? [];
  const ids = encontrados.map((m) => m.replace(/data-dispositivo="([^"]+)"/, '$1'));
  return [...new Set(ids)];
}
