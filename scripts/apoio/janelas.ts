/**
 * Janelas deslizantes de texto (LU-F4.2-N6). Fonte única da extração que o portão do webroot
 * (scripts/verificar-webroot-sem-conteudo.ts) e o índice da partição (scripts/apoio/textoDeEstudo.ts)
 * usam: cada posição do texto dá uma janela de `tamanho` caracteres, e um texto menor que a
 * janela dá zero janelas. Quem chama decide a normalização; este módulo só corta.
 *
 * É um gerador: o texto de estudo da árvore inteira não vira uma lista de strings de uma vez.
 * Janelas repetidas saem todas, na ordem da posição (o contador do portão depende disso).
 */
export const TAMANHO_JANELA = 40;

export function* janelasDe(texto: string, tamanho: number = TAMANHO_JANELA): Generator<string> {
  for (let i = 0; i + tamanho <= texto.length; i += 1) {
    yield texto.slice(i, i + tamanho);
  }
}
