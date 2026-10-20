import type { RotulosCategoriaQuiz } from './rotulosCategoria';

/**
 * Categorias usadas nas perguntas que não têm rótulo no mapa, sem repetição
 * e em ordem alfabética. Função pura: quem chama decide o que fazer com a
 * lista (o teste reprova; o validador de conteúdo também).
 */
export function categoriasSemRotulo(
  perguntas: readonly { readonly categoria: string }[],
  rotulos: RotulosCategoriaQuiz
): string[] {
  const semRotulo = new Set<string>();
  for (const { categoria } of perguntas) {
    if (!rotulos[categoria]) semRotulo.add(categoria);
  }
  return [...semRotulo].sort();
}
