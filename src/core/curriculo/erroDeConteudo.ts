/**
 * Pasta de conteúdo fora do formato esperado (arquivo a mais, arquivo que
 * falta, nome fora do padrão). Lançado na descoberta e na montagem, para que
 * o build e os testes reprovem com a unidade nomeada, em vez de omitir a
 * aba ou a unidade em silêncio.
 */
export class ErroDeConteudo extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroDeConteudo';
  }
}
