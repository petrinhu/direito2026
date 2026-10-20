import { categoriasSemRotulo } from '../quiz/categoriasSemRotulo';
import type { RotulosCategoriaQuiz } from '../quiz/rotulosCategoria';
import type { PerguntaQuiz } from '../unidade/tipos';
import type { ErroDeUnidade } from './tipos';

/** Toda categoria usada no quiz tem rótulo no mapa de dado (src/conteudo/quiz/categorias.ts). */
export function validarCategorias(
  quiz: readonly PerguntaQuiz[],
  rotulos: RotulosCategoriaQuiz
): ErroDeUnidade[] {
  const orfas = categoriasSemRotulo(quiz, rotulos);
  if (orfas.length === 0) return [];
  return [
    {
      regra: 'categoria-sem-rotulo',
      caminho: 'quiz',
      detalhe: `sem rótulo em src/conteudo/quiz/categorias.ts: ${orfas.join(', ')}`
    }
  ];
}
