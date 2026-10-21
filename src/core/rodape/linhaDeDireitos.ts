/**
 * Monta a linha de direitos do rodapé: versão do site, copyright e nome do
 * caderno. Formato decidido pelo líder em 20/10/2026 ("v1.0.0.0 · © 2026
 * Caderno de Direito"; a partir do ano seguinte ao de lançamento, a faixa
 * de anos com hífen comum: "© 2026-2027").
 *
 * Função pura: recebe versão e anos como argumentos, sem relógio nem
 * package.json, para ser testada em Node puro (tests/unidade).
 */
export function montarLinhaDeDireitos(
  versao: string,
  anoInicial: number,
  anoAtual: number
): string {
  const anos = anoAtual <= anoInicial ? `${anoInicial}` : `${anoInicial}-${anoAtual}`;
  return `v${versao} · © ${anos} Caderno de Direito`;
}
