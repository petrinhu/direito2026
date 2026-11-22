import type { ChaveAba } from '../curriculo/tipos';

export interface DocumentoBusca {
  /** Ex.: 'p1/intr-direito/u1#bloco-3'. */
  readonly id: string;
  readonly url: string;
  readonly periodo: string;
  readonly cadeira: string;
  readonly unidade: string;
  readonly aba: ChaveAba;
  readonly titulo: string;
  /** Texto puro, sem tags, usado para casar o termo. */
  readonly corpo: string;
  /** Primeiros ~200 caracteres, usados no cartão de resultado. */
  readonly trecho: string;
}

export type IndiceBusca = readonly DocumentoBusca[];

/** Teto fixado antes de existir a medição real (L-43, seção 7 da arquitetura). */
export const TETO_INDICE_BUSCA_BYTES = 300 * 1024;

/**
 * Índice do texto integral, à parte do índice principal (EP-F11-BUSCA-TETO):
 * só desce quando a busca principal não acha nada ou quando o aluno pede a
 * busca no texto da lei. Fica em assets/ pelo mesmo motivo do principal.
 */
export const ARQUIVO_INDICE_TEXTO_INTEGRAL = 'busca-texto-integral.json';

/**
 * Porta de saída para o motor de busca (Dependency Inversion, seção 7: "o
 * resto do site conversa com uma interface MotorBusca, não com a
 * biblioteca"). app/busca traz o adaptador concreto sobre MiniSearch; a
 * troca por Pagefind (RI6) fica contida nesse adaptador.
 */
export interface MotorBusca {
  consultar(termo: string): readonly DocumentoBusca[];
}
