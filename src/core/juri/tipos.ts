import type { PerguntaQuiz } from '../unidade/tipos';
import type { CodigoErroRestrito, NoMapa } from '../restrito/tipos';

/** Códigos da validação da Júri: os do allowlist de HTML mais os desta área. */
export type CodigoErroJuri =
  | CodigoErroRestrito
  | 'fontes'
  | 'linha-impar'
  | 'citacao-de-alternativa'
  | 'alternativas-homogeneas'
  | 'imagem-id-invalido'
  | 'imagem-fora-do-indice';

/** Erro de validação: nunca carrega o valor, só código e caminho. */
export interface ErroValidacaoJuri {
  readonly codigo: CodigoErroJuri;
  readonly caminho: string;
}

/**
 * Bloco do resumo. `linhaA` (a linha da acusação pelo laudo da simulação) e
 * `linhaB` (o que o caso real sustenta) são opcionais, mas vêm em par.
 */
export interface BlocoResumoJuri {
  readonly id: string;
  readonly titulo: string;
  readonly corpoHtml: string;
  readonly linhaA?: string;
  readonly linhaB?: string;
  readonly fontes: readonly string[];
}

export interface LinhaQuadroTermos {
  readonly termo: string;
  readonly definicaoHtml: string;
  readonly regiao: string;
  readonly fontes: readonly string[];
}

export interface FichaJuri {
  readonly id: string;
  readonly titulo: string;
  readonly oQueEHtml: string;
  readonly fonteDizHtml: string;
  readonly acusacaoUsaHtml: string;
  /** Como a acusação neutraliza a tese da defesa sobre este item. */
  readonly acusacaoNeutralizaHtml: string;
  readonly fontes: readonly string[];
}

/** Tese da defesa e resposta da acusação. Não há campo de limite: a peça é de acusação. */
export interface ItemRespostaDefesa {
  readonly id: string;
  readonly teseHtml: string;
  readonly respostaHtml: string;
  readonly fontes: readonly string[];
}

export interface MnemonicoJuri {
  readonly id: string;
  readonly dicaHtml: string;
  readonly respostaHtml: string;
  readonly fontes: readonly string[];
}

/** Referência a uma foto cifrada do acervo. O id é o nome do arquivo `.juri`. */
export interface ImagemJuri {
  readonly id: string;
  readonly legenda: string;
  readonly fontes: readonly string[];
}

/**
 * Pergunta no formato das páginas de estudo (múltipla escolha de 4 ou 5, ou
 * verdadeiro ou falso), mais as fontes exigidas pela Júri.
 */
export type PerguntaJuri = PerguntaQuiz & { readonly fontes: readonly string[] };

/** Forma do JSON da Júri depois de validado. */
export interface ConteudoJuri {
  readonly titulo: string;
  readonly resumo: readonly BlocoResumoJuri[];
  readonly quadroTermos: readonly LinhaQuadroTermos[];
  /** Análise que vem logo depois do quadro. Opcional; quando vem, é html validado. */
  readonly notaQuadroHtml?: string;
  readonly fichamento: readonly FichaJuri[];
  readonly respostasDefesa: readonly ItemRespostaDefesa[];
  readonly mnemonicos: readonly MnemonicoJuri[];
  readonly mapa: NoMapa;
  readonly quiz: readonly PerguntaJuri[];
  readonly imagens: readonly ImagemJuri[];
  /** Referências ABNT, cada item é texto puro. Sem o campo no JSON, vem como lista vazia. */
  readonly referencias: readonly string[];
}

declare const marcaValidado: unique symbol;

/**
 * Só `validarConteudoJuri` produz este tipo. JSON cru não satisfaz a marca,
 * então nenhum caminho do código entrega à interface um conteúdo que não
 * passou pela allowlist de HTML, pelo índice de imagens e pela forma do quiz.
 */
export type ConteudoJuriValidado = ConteudoJuri & { readonly [marcaValidado]: true };

export type ResultadoValidacaoJuri =
  | { readonly ok: true; readonly conteudo: ConteudoJuriValidado }
  | { readonly ok: false; readonly erros: readonly ErroValidacaoJuri[] };
