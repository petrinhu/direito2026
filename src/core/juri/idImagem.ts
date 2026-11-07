/** Id do acervo: 32 hex minúsculos, o nome do arquivo `imagens/<id>` no servidor. */
const ID_HEX = /^[0-9a-f]{32}$/;

/** Verdadeiro só para o formato exato do id (nunca aproximado). */
export function ehIdImagem(valor: unknown): valor is string {
  return typeof valor === 'string' && ID_HEX.test(valor);
}
