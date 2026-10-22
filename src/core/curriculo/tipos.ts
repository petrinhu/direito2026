/** Estado de publicação de qualquer nó do currículo. */
export type EstadoPublicacao = 'publicado' | 'em-breve';

/** Abas possíveis de uma unidade. Fechado de propósito: o layout depende disso. */
export type ChaveAba =
  'resumo' | 'texto' | 'mapa' | 'fichamento' | 'mnemonicos' | 'peticao' | 'quiz';

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

/**
 * Atalho do menu lateral para a cadeira restrita Interdisciplinar (ordem do
 * líder: "a segunda unidade é o interdisciplinar, link para ele"). Não é
 * unidade: não tem abas, carregador nem página própria, e por isso mora fora
 * de `Cadeira.unidades`. Busca, trilha e roteador nunca o enxergam; a home lê o atalho só para desenhar a linha da placa.
 */
export interface AtalhoUnidade {
  /** Rótulo exibido no menu. Ex.: 'Interdisciplinar'. */
  readonly rotulo: string;
  /** Id da unidade da própria cadeira após a qual o atalho aparece. Ex.: 'u1'. */
  readonly apos: string;
  /** Id da cadeira restrita de destino, no mesmo período. Ex.: 'interdisciplinar'. */
  readonly cadeiraId: string;
}

export interface Cadeira {
  /** Slug usado na URL. Ex.: 'intr-direito'. */
  readonly id: string;
  readonly nome: string;
  readonly estado: EstadoPublicacao;
  /**
   * Cadeira de acesso restrito (login no servidor). O conteúdo NÃO existe
   * no repositório nem no pacote: `unidades` fica vazio, a página própria
   * pede tudo à API depois do login e a busca só conhece o título.
   */
  readonly restrita?: true;
  readonly unidades: readonly ReferenciaUnidade[];
  /** Atalho opcional no menu lateral para outra cadeira (só o menu o lê). */
  readonly atalhoUnidade?: AtalhoUnidade;
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
