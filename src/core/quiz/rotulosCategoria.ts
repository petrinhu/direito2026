/**
 * Mapa de rótulos de categoria de quiz: categoria (texto livre) -> rótulo de
 * exibição. O valor concreto é dado de conteúdo, em
 * src/conteudo/quiz/categorias.ts; o core só conhece a forma.
 */
export type RotulosCategoriaQuiz = Readonly<Record<string, string>>;
