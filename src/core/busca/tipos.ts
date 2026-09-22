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
