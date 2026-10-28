/**
 * Falhas da cifra da Júri, com código estável. A interface e o teste comparam o
 * código, nunca a mensagem, e o erro cru do WebCrypto nunca chega a quem chama.
 */
export type CodigoErroCifra =
  | 'formato'
  | 'tamanho'
  | 'versao'
  | 'algoritmo'
  | 'tipo'
  | 'reservado'
  | 'kid'
  | 'id'
  | 'integridade'
  | 'entrada';

export class ErroCifra extends Error {
  readonly codigo: CodigoErroCifra;

  constructor(codigo: CodigoErroCifra) {
    super(`juri-cifra: ${codigo}`);
    this.name = 'ErroCifra';
    this.codigo = codigo;
  }
}
