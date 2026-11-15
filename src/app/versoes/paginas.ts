import historicoBruto from '@/dados/versoes/historico.json';
import { compararVersoes, validarHistorico } from '@/core/versoes/validacao';

/** Uma versão do histórico, como está gravada em src/dados/versoes/historico.json. */
export interface EntradaHistorico {
  versao: string;
  data: string;
  didatico: string[];
  tecnico: string[];
}

/** Uma seção pronta para a página: versão, data e os itens que a página mostra. */
export interface EntradaPagina {
  versao: string;
  data: string;
  dataFormatada: string;
  itens: string[];
}

export type CargaHistorico =
  { ok: true; entradas: EntradaHistorico[] } | { ok: false; erros: string[] };

/** AAAA-MM-DD para DD/MM/AAAA (a validação já garantiu a forma). */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function maisNovaPrimeiro(entradas: readonly EntradaHistorico[]): EntradaHistorico[] {
  return [...entradas].sort((a, b) => compararVersoes(b.versao, a.versao));
}

function paginar(
  entradas: readonly EntradaHistorico[],
  escolher: (e: EntradaHistorico) => string[]
): EntradaPagina[] {
  return maisNovaPrimeiro(entradas).map((e) => ({
    versao: e.versao,
    data: e.data,
    dataFormatada: formatarData(e.data),
    itens: escolher(e)
  }));
}

/** Página Novidades: a mais nova primeiro, com o texto didático de cada versão. */
export function paginaNovidades(entradas: readonly EntradaHistorico[]): EntradaPagina[] {
  return paginar(entradas, (e) => e.didatico);
}

/** Página Changelog: a mais nova primeiro, com o texto técnico de cada versão. */
export function paginaChangelog(entradas: readonly EntradaHistorico[]): EntradaPagina[] {
  return paginar(entradas, (e) => e.tecnico);
}

/**
 * Carrega o histórico e valida antes de usar. Um histórico inválido não é mostrado: devolve os
 * erros, e a página diz que não conseguiu carregar.
 */
export function carregarHistorico(origem: unknown = historicoBruto): CargaHistorico {
  const r = validarHistorico(origem);
  if (!r.ok) return { ok: false, erros: r.erros };
  return { ok: true, entradas: origem as EntradaHistorico[] };
}
