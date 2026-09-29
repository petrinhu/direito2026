import type {
  AlternativasQuiz,
  CategoriaQuiz,
  IndiceAlternativa,
  PerguntaQuiz
} from '../unidade/tipos';

export type { AlternativasQuiz, CategoriaQuiz, IndiceAlternativa, PerguntaQuiz };

export interface PerguntaEmbaralhada {
  readonly id: number;
  readonly categoria: CategoriaQuiz;
  /** HTML confiável: ver o mesmo campo em PerguntaQuiz (core/unidade/tipos.ts). */
  readonly enunciadoHtml: string;
  readonly explicacaoHtml: string;
  readonly fonteExtra: boolean;
  readonly alternativasHtml: AlternativasQuiz;
  readonly indiceCorreto: IndiceAlternativa;
  readonly gabaritoDoCaderno?: true;
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
