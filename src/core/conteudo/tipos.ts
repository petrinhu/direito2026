/**
 * Regra que uma unidade pode quebrar. O nome é estável: aparece na saída do
 * script de validação e na falha da varredura, então quem lê sabe qual regra
 * reprovou sem abrir o código.
 */
export type RegraDeUnidade =
  | 'ids-unicos'
  | 'alternativas'
  | 'alternativas-homogeneas'
  | 'correta'
  | 'citacao-de-alternativa'
  | 'texto-proibido'
  | 'fonte-proibida'
  | 'referencia-de-ficha'
  | 'vazio'
  | 'gabarito-do-caderno'
  | 'categoria-sem-rotulo'
  | 'fonte-repetida-no-corpo'
  | 'titulo-com-numero-de-bloco';

/** Um achado: a regra, o caminho dentro do ConteudoUnidade e o que foi achado. */
export interface ErroDeUnidade {
  readonly regra: RegraDeUnidade;
  readonly caminho: string;
  readonly detalhe: string;
}
