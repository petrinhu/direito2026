/**
 * Mnemônicos de uma unidade. O conteúdo factual vem sempre do resumo; o
 * mnemônico é só o apoio de memória, e a técnica usada vem declarada.
 */
export type TecnicaMnemonica =
  | 'associacao'
  | 'imagem'
  | 'frase'
  | 'acronimo'
  | 'loci'
  | 'chunking';

export interface ItemGuardado {
  /** O que a dica faz lembrar. Ex.: 'Lei natural'. */
  readonly termo: string;
  /** O conteúdo do material que o termo guarda. */
  readonly explicacao: string;
}

export interface Mnemonico {
  readonly id: string;
  /** O que é confundido ou difícil de ordenar. Ex.: 'As leis em Tomás de Aquino'. */
  readonly titulo: string;
  readonly tecnica: TecnicaMnemonica;
  /** A dica, visível antes de revelar. */
  readonly dica: string;
  /** O que a pessoa deve tentar dizer de cabeça antes de revelar. */
  readonly desafio: string;
  readonly guarda: readonly ItemGuardado[];
  /** Por que a dica funciona, em uma ou duas frases. */
  readonly comoFunciona: string;
  /** Aviso de fonte ou de divergência, quando o conteúdo exige. */
  readonly ressalva?: string;
  /** Id do bloco do resumo de onde o conteúdo foi tirado. */
  readonly blocoResumo: string;
}
