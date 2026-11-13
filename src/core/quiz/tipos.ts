import type {
  AlternativasQuiz,
  AlternativasVerdadeiroOuFalso,
  OrigemPergunta,
  CategoriaQuiz,
  IndiceAlternativa,
  PerguntaQuiz
} from '../unidade/tipos';

export type {
  AlternativasQuiz,
  AlternativasVerdadeiroOuFalso,
  CategoriaQuiz,
  IndiceAlternativa,
  OrigemPergunta,
  PerguntaQuiz
};

export interface PerguntaEmbaralhada {
  readonly id: number;
  readonly categoria: CategoriaQuiz;
  /** HTML confiável: ver o mesmo campo em PerguntaQuiz (core/unidade/tipos.ts). */
  readonly enunciadoHtml: string;
  readonly explicacaoHtml: string;
  readonly fonteExtra: boolean;
  /** Verdadeiro ou falso: sempre as duas alternativas fixas, nessa ordem. */
  readonly alternativasHtml: AlternativasQuiz | AlternativasVerdadeiroOuFalso;
  readonly indiceCorreto: IndiceAlternativa;
  /** Só presente (e só 'verdadeiro-ou-falso') nas perguntas de verdadeiro ou falso. */
  readonly tipo?: 'verdadeiro-ou-falso';
  readonly gabaritoDoCaderno?: true;
  readonly origem?: OrigemPergunta;
}

/**
 * Forma de uma pergunta do quiz no ar, sem texto: id, tipo e número de alternativas.
 * É o que uma resposta salva indexa, então a forma congelada (AV3-K4) guarda esta lista.
 */
export interface FormaPergunta {
  readonly id: number;
  readonly tipo: 'mc' | 'vf';
  /** Verdadeiro ou falso tem 2 alternativas fixas e não gasta sorteio. */
  readonly alternativas: 2 | 4 | 5;
}

export interface RodadaQuiz {
  readonly perguntas: readonly PerguntaEmbaralhada[];
  /** Chave: id da pergunta. Valor: índice escolhido na ordem embaralhada. */
  readonly respostas: Readonly<Record<number, IndiceAlternativa>>;
  readonly indiceAtual: number;
  readonly finalizada: boolean;
}

export interface PontuacaoCategoria {
  readonly categoria: CategoriaQuiz;
  readonly acertos: number;
  readonly total: number;
}

export interface Pontuacao {
  readonly acertos: number;
  readonly total: number;
  readonly porCategoria: readonly PontuacaoCategoria[];
}
