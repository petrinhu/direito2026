/**
 * Extrai o segmento literal de primeiro nível de um path de rota (formato
 * vue-router), o único que pode colidir com o nome de uma pasta de
 * primeiro nível do pacote publicado. Devolve undefined quando não há
 * segmento fixo (rota raiz, ou primeiro segmento já dinâmico/wildcard).
 *
 * Usado por scripts/verificar-colisao-rotas.sh (achado do líder,
 * 22/09/2026: uma pasta dist/busca/ colidia com a rota /busca, 403 no
 * Apache por redirecionamento de diretório).
 */
export function extrairSegmentoPrimeiroNivel(caminhoRota: string): string | undefined {
  const segmentos = caminhoRota.split('/').filter((s) => s.length > 0);
  const primeiro = segmentos[0];
  if (!primeiro) return undefined;
  if (primeiro.startsWith(':')) return undefined; // parâmetro dinâmico ou wildcard
  return primeiro;
}
