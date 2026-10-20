import type { RotulosCategoriaQuiz } from '../quiz/rotulosCategoria';
import type { ConteudoUnidade } from '../unidade/tipos';
import { validarAlternativas } from './validarAlternativas';
import { validarBlocos } from './validarBlocos';
import { validarCategorias } from './validarCategorias';
import { validarCitacaoDeAlternativa } from './validarCitacaoDeAlternativa';
import { validarFichas } from './validarFichas';
import { validarMeta } from './validarMeta';
import { validarPerguntas } from './validarPerguntas';
import { validarPlaceholder } from './validarPlaceholder';
import { validarTextos } from './validarTextos';
import { validarTravessao } from './validarTravessao';
import type { ErroDeUnidade } from './tipos';

/**
 * Função pura: o conteúdo de UMA unidade, já carregado, devolve a lista de
 * achados (vazia quando a unidade passa). Não lê disco nem glob: quem chama
 * entrega o conteúdo, e a mesma regra vale no spec (glob) e no script (fs).
 */
export function validarUnidade(
  conteudo: ConteudoUnidade,
  rotulos: RotulosCategoriaQuiz
): ErroDeUnidade[] {
  const quiz = conteudo.quiz ?? [];
  return [
    ...validarMeta(conteudo.meta),
    ...validarPerguntas(quiz),
    ...validarAlternativas(quiz),
    ...validarCitacaoDeAlternativa(quiz),
    ...validarCategorias(quiz, rotulos),
    ...validarBlocos(conteudo.resumo),
    ...validarTextos(conteudo),
    ...validarTravessao(conteudo),
    ...validarPlaceholder(conteudo),
    ...validarFichas(conteudo)
  ];
}
