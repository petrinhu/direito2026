/**
 * Extrai a lista de pastas da linha
 * `RewriteCond %{REQUEST_URI} ^/(assets|icones)(/|$)` do .htaccess: a
 * lista explícita de pastas que o servidor deixa passar direto, sem cair
 * na SPA (seção 5 da arquitetura; achado do líder, 22/09/2026).
 */
export function extrairPastasPermitidas(htaccessTexto: string): string[] {
  const casamento = htaccessTexto.match(/REQUEST_URI\}\s*\^\/\(([a-z0-9|_-]+)\)\(\/\|\$\)/);
  if (!casamento) return [];
  return (casamento[1] as string).split('|');
}
