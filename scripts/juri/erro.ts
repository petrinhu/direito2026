/**
 * Falha esperada da ferramenta do acervo. A mensagem vai para o terminal de quem roda a
 * ferramenta, então nunca carrega segredo (senha, AUTH, salt, embrulho, kid), valor de
 * metadado (nome, GPS, comentário) nem nome de arquivo dos originais.
 */
export class ErroFerramenta extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroFerramenta';
  }
}

/** Uso incorreto da linha de comando: sai com código 2, separado da falha de execução (código 1). */
export class ErroUso extends ErroFerramenta {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroUso';
  }
}
