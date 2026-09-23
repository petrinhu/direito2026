export interface MetaUnidade {
  readonly titulo: string;
  readonly subtitulo: string;
  /** Usado em <meta name="description"> e no cartão de resultado da busca. */
  readonly descricao: string;
}

/**
 * Chaves dos componentes interativos "extra" que podem aparecer dentro de
 * um bloco de resumo (BlocoResumo.componenteExtra), além do corpoHtml
 * estático. Nasceram com a unidade de Redação Jurídica 1 (checklist do
 * art. 319, cartões das cinco perguntas, dicas de forma da professora);
 * fechado de propósito, igual a ChaveAba.
 */
export type ChaveComponenteExtra =
  | 'checklist-art-319'
  | 'cartoes-cinco-perguntas'
  | 'dicas-forma-professora';

/** Um bloco teórico do resumo. */
export interface BlocoResumo {
  /** Âncora estável dentro da página. Ex.: 'bloco-0'. */
  readonly id: string;
  /** Posição exibida, começando em 1. */
  readonly numero: number;
  readonly titulo: string;
  /** Referência bibliográfica da fonte do bloco. */
  readonly fonte: string;
  /** Selo opcional. Ex.: 'Aprofundamento'. */
  readonly badge?: string;
  /** Corpo em HTML confiável, de origem interna. Ver nota de segurança, seção 4.4 do plano. */
  readonly corpoHtml: string;
  /** Itens do quadro-resumo de revisão. */
  readonly resumo: readonly string[];
  /** Parágrafo "na prática do operador do direito", em HTML confiável. */
  readonly exemploHtml: string;
  /**
   * Componente interativo renderizado entre corpoHtml e o quadro-resumo,
   * quando o bloco carrega um dos três extras da unidade. Ausente na
   * maioria dos blocos (é a exceção, não a regra).
   */
  readonly componenteExtra?: ChaveComponenteExtra;
}

/** Uma seção da peça comentada. */
export interface SecaoPeca {
  /** Âncora estável. Ex.: 'enderecamento'. */
  readonly id: string;
  /** Ex.: 'Endereçamento', 'Qualificação', 'Dos Fatos'. */
  readonly titulo: string;
  /** O texto da peça em si. */
  readonly corpoHtml: string;
  /** O comentário "como fazer", exibido em destaque ao lado ou abaixo. */
  readonly comentarioHtml: string;
}

export interface PecaComentada {
  readonly titulo: string;
  /** Nota introdutória que explica a natureza do documento e dos comentários. */
  readonly notaHtml: string;
  /**
   * Enunciado do caso, transcrito por inteiro, exibido antes das seções da
   * peça (ordem do líder, 22/09/2026: "para facilitar o entendimento da
   * peça"). Opcional: a unidade-piloto (Introdução ao Direito) não tem
   * enunciado, só o caso já resolvido na peça; a de Redação Jurídica 1 tem.
   */
  readonly enunciadoHtml?: string;
  readonly secoes: readonly SecaoPeca[];
}

/** Categorias de pergunta previstas pelo piloto (40, 10 e 10 perguntas). */
export type CategoriaQuiz = 'teoria' | 'peticao' | 'fundamentos';

export interface PerguntaQuiz {
  readonly id: number;
  readonly categoria: CategoriaQuiz;
  /**
   * HTML confiável, de origem interna (mesma regra de corpoHtml acima,
   * RI5/seção 4.4): enunciado, alternativa e explicação legitimamente
   * carregam o botão de citação (seção 12.1), então os três campos
   * terminam em "Html" e são renderizados com v-html, nunca com `{{ }}`
   * (achado do QA, 22/09/2026: `{{ }}` escapa a marcação e ela aparecia
   * crua na tela).
   */
  readonly enunciadoHtml: string;
  /** Sempre 4 alternativas. A tupla trava isso no compilador. */
  readonly alternativasHtml: readonly [string, string, string, string];
  /** Índice da correta no array original, antes de embaralhar. */
  readonly correta: 0 | 1 | 2 | 3;
  /** true quando a explicação apoia-se em artigo fora do conjunto base da disciplina. */
  readonly fonteExtra: boolean;
  readonly explicacaoHtml: string;
}

export interface ConteudoUnidade {
  readonly meta: MetaUnidade;
  readonly resumo: readonly BlocoResumo[];
  readonly peticao?: PecaComentada;
  readonly quiz?: readonly PerguntaQuiz[];
}
