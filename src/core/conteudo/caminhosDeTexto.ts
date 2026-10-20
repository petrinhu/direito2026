/** Uma string do conteúdo, com o caminho dela e o nome do campo que a guarda. */
export interface TextoNoCaminho {
  readonly caminho: string;
  readonly campo: string;
  readonly texto: string;
}

/**
 * Percorre todo texto de um valor. O campo é a última chave com nome (em
 * arrays, a chave do próprio array), para regras que dependem do campo, como
 * `fonte`.
 */
export function textosDoValor(valor: unknown, caminho = '', campo = ''): TextoNoCaminho[] {
  if (typeof valor === 'string') return [{ caminho, campo, texto: valor }];
  if (Array.isArray(valor)) {
    return valor.flatMap((item, i) => textosDoValor(item, `${caminho}[${i}]`, campo));
  }
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([chave, item]) =>
      textosDoValor(item, caminho ? `${caminho}.${chave}` : chave, chave)
    );
  }
  return [];
}
