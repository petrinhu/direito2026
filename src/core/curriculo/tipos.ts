/** Estado de publicação de qualquer nó do currículo. */
export type EstadoPublicacao = 'publicado' | 'em-breve';

/** Abas possíveis de uma unidade. Fechado de propósito: o layout depende disso. */
export type ChaveAba = 'resumo' | 'peticao' | 'quiz';

export interface ReferenciaUnidade {
  /** Slug estável usado na URL. Ex.: 'u1'. */
  readonly id: string;
  /** Rótulo curto no menu. Ex.: 'Unidade 1'. */
  readonly rotulo: string;
  /** Título longo, usado no cabeçalho da página. */
  readonly titulo: string;
  readonly estado: EstadoPublicacao;
  /** Abas que esta unidade realmente tem. Vazio quando estado é 'em-breve'. */
  readonly abas: readonly ChaveAba[];
  /**
   * Carregador sob demanda do conteúdo. Ausente quando estado é 'em-breve'.
   * Implementado, em src/app/carregamento, como
   * () => import('../../conteudo/p1/intr-direito/u1').
   */
  readonly carregar?: () => Promise<import('../unidade/tipos').ConteudoUnidade>;
}

export interface Cadeira {
  /** Slug usado na URL. Ex.: 'intr-direito'. */
  readonly id: string;
  readonly nome: string;
  readonly estado: EstadoPublicacao;
  readonly unidades: readonly ReferenciaUnidade[];
}

export interface Periodo {
  /** Slug usado na URL. Ex.: 'p1'. */
  readonly id: string;
  /** 1 a 10. */
  readonly numero: number;
  /** Ex.: '1o período'. */
  readonly rotulo: string;
  readonly cadeiras: readonly Cadeira[];
}

export type Curriculo = readonly Periodo[];

/** Resultado da resolução de uma URL contra o currículo. Função pura de core. */
export type ResolucaoRota =
  | {
      readonly tipo: 'encontrado';
      readonly periodo: Periodo;
      readonly cadeira: Cadeira;
      readonly unidade: ReferenciaUnidade;
      readonly aba: ChaveAba;
    }
  | {
      readonly tipo: 'em-breve';
      readonly periodo: Periodo;
      readonly cadeira?: Cadeira;
      readonly unidade?: ReferenciaUnidade;
    }
  | { readonly tipo: 'inexistente' };
