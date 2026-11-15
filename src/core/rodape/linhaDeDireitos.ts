/**
 * Monta a linha de direitos do rodapé: versão do site, copyright e nome do
 * caderno. Formato decidido pelo líder em 20/10/2026 ("v1.0.0.0 · © 2026
 * Caderno de Direito"; a partir do ano seguinte ao de lançamento, a faixa
 * de anos com hífen comum: "© 2026-2027").
 *
 * Com titular (ordem do líder, 15/11/2026: o nome no copyright é link para o
 * e-mail de contato), a linha vira "v1.0.0.0 · © 2026 <titular> · Caderno de
 * Direito". Titular vazio ou só com espaços mantém o formato de hoje.
 *
 * Função pura: recebe versão, anos e titular como argumentos, sem relógio nem
 * package.json, para ser testada em Node puro (tests/unidade).
 */

export interface PartesDaLinhaDeDireitos {
  readonly antes: string;
  readonly titular: string;
  readonly depois: string;
}

/**
 * Separa a linha em três trechos, para a tela pôr o link no meio. Sem titular,
 * `antes` traz a linha inteira e os outros dois ficam vazios.
 */
export function partesDaLinhaDeDireitos(
  versao: string,
  anoInicial: number,
  anoAtual: number,
  titular = ''
): PartesDaLinhaDeDireitos {
  const anos = anoAtual <= anoInicial ? `${anoInicial}` : `${anoInicial}-${anoAtual}`;
  const nome = titular.trim();
  if (nome === '') {
    return { antes: `v${versao} · © ${anos} Caderno de Direito`, titular: '', depois: '' };
  }
  return { antes: `v${versao} · © ${anos} `, titular: nome, depois: ' · Caderno de Direito' };
}

export function montarLinhaDeDireitos(
  versao: string,
  anoInicial: number,
  anoAtual: number,
  titular = ''
): string {
  const partes = partesDaLinhaDeDireitos(versao, anoInicial, anoAtual, titular);
  return `${partes.antes}${partes.titular}${partes.depois}`;
}
