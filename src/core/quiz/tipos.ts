import type { CategoriaQuiz, PerguntaQuiz } from '../unidade/tipos';

export type { CategoriaQuiz, PerguntaQuiz };

export interface PerguntaEmbaralhada {
  readonly id: number;
  readonly categoria: CategoriaQuiz;
  /** HTML confiável: ver o mesmo campo em PerguntaQuiz (core/unidade/tipos.ts). */
  readonly enunciadoHtml: string;
  readonly explicacaoHtml: string;
  readonly fonteExtra: boolean;
  readonly alternativasHtml: readonly [string, string, string, string];
  readonly indiceCorreto: 0 | 1 | 2 | 3;
}

export interface RodadaQuiz {
  readonly perguntas: readonly PerguntaEmbaralhada[];
  /** Chave: id da pergunta. Valor: índice escolhido na ordem embaralhada. */
  readonly respostas: Readonly<Record<number, 0 | 1 | 2 | 3>>;
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
