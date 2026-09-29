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
  'checklist-art-319' | 'cartoes-cinco-perguntas' | 'dicas-forma-professora';

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
  /**
   * O texto da peça em si. Opcional: uma seção-título "guarda-chuva"
   * (ex.: "2. Do Direito", que só organiza os tópicos 2.1 a 2.5 que vêm
   * depois dela, sem texto de peça próprio) não tem corpo nenhum, só
   * título e comentário explicando o método. Ausente, não vazio: uma
   * string vazia ainda desenharia um bloco em branco.
   */
  readonly corpoHtml?: string;
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

/**
 * Categorias de pergunta. As três primeiras nasceram no piloto (40, 10 e 10
 * perguntas); as quatro seguintes são da unidade de Sociologia Jurídica; as
 * três últimas (Idade Antiga, Idade Média, revisão do professor) são de
 * Filosofia Jurídica.
 */
export type CategoriaQuiz =
  | 'teoria'
  | 'peticao'
  | 'fundamentos'
  | 'atividade'
  | 'conceitos'
  | 'classicos'
  | 'aplicacao'
  | 'antiga'
  | 'media'
  | 'revisao';

/** Posição de uma alternativa na ordem original: 0 é A, 4 é E. */
export type IndiceAlternativa = 0 | 1 | 2 | 3 | 4;

/**
 * Quatro alternativas (Introdução ao Direito e Redação Jurídica 1) ou cinco
 * (Sociologia Jurídica). A união de tuplas trava o número no compilador; o
 * teste de conteúdo garante que `correta` cabe no tamanho.
 */
export type AlternativasQuiz =
  readonly [string, string, string, string] | readonly [string, string, string, string, string];

/** Duas alternativas fixas de uma pergunta de verdadeiro ou falso. */
export type AlternativasVerdadeiroOuFalso = readonly [string, string];

/** Quem redigiu a pergunta, quando não foi o caderno. Hoje só o professor. */
export type OrigemPergunta = 'professor';

interface PerguntaBase {
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
  /** true quando a explicação apoia-se em artigo fora do conjunto base da disciplina. */
  readonly fonteExtra: boolean;
  readonly explicacaoHtml: string;
  /**
   * true quando a resposta certa vem do caderno de estudo e não de um
   * gabarito oficial da professora: a explicação ganha uma nota neutra
   * dizendo isso. Ausente nas demais (nunca `false`).
   */
  readonly gabaritoDoCaderno?: true;
  /**
   * 'professor' quando a pergunta é do simulado do professor: o cartão
   * mostra o selo "Revisão do professor" antes do enunciado. Ausente nas
   * demais.
   */
  readonly origem?: OrigemPergunta;
}

/** Quatro ou cinco alternativas, embaralhadas a cada rodada. `tipo` é omitido. */
export interface PerguntaMultiplaEscolha extends PerguntaBase {
  readonly tipo?: 'multipla-escolha';
  /** 4 ou 5 alternativas. A união de tuplas trava isso no compilador. */
  readonly alternativasHtml: AlternativasQuiz;
  /** Índice da correta no array original, antes de embaralhar. */
  readonly correta: IndiceAlternativa;
}

/**
 * Afirmação para julgar. As alternativas são fixas ("Verdadeiro", "Falso",
 * nessa ordem, sem letras e nunca embaralhadas), então a pergunta não
 * declara alternativas: só diz se a afirmação é verdadeira.
 */
export interface PerguntaVerdadeiroOuFalso extends PerguntaBase {
  readonly tipo: 'verdadeiro-ou-falso';
  /** true se a afirmação do enunciado é verdadeira. */
  readonly correta: boolean;
}

export type PerguntaQuiz = PerguntaMultiplaEscolha | PerguntaVerdadeiroOuFalso;

export interface ConteudoUnidade {
  readonly meta: MetaUnidade;
  readonly resumo: readonly BlocoResumo[];
  readonly peticao?: PecaComentada;
  readonly quiz?: readonly PerguntaQuiz[];
}
