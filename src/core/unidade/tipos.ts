export interface MetaUnidade {
  readonly titulo: string;
  readonly subtitulo: string;
  /** Usado em <meta name="description"> e no cartão de resultado da busca. */
  readonly descricao: string;
}

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
  readonly secoes: readonly SecaoPeca[];
}

/** Categorias de pergunta previstas pelo piloto (40, 10 e 10 perguntas). */
export type CategoriaQuiz = 'teoria' | 'peticao' | 'fundamentos';

export interface PerguntaQuiz {
  readonly id: number;
  readonly categoria: CategoriaQuiz;
  readonly enunciado: string;
  /** Sempre 4 alternativas. A tupla trava isso no compilador. */
  readonly alternativas: readonly [string, string, string, string];
  /** Índice da correta no array original, antes de embaralhar. */
  readonly correta: 0 | 1 | 2 | 3;
  /** true quando a explicação apoia-se em artigo fora do conjunto base da disciplina. */
  readonly fonteExtra: boolean;
  readonly explicacao: string;
}

export interface ConteudoUnidade {
  readonly meta: MetaUnidade;
  readonly resumo: readonly BlocoResumo[];
  readonly peticao?: PecaComentada;
  readonly quiz?: readonly PerguntaQuiz[];
}
