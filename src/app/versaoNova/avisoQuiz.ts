import { caminhoEmAreaRestrita } from '@/core/curriculo/areaRestrita';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Frase do quiz no aviso de versão, nas áreas restritas (decisão 72 do líder, 14/11, ratificada):
 * a recarga perde as respostas marcadas ali (a Júri e o Interdisciplinar não gravam no navegador).
 */
export const FRASE_QUIZ_AREA_RESTRITA =
  'Se você estiver fazendo o quiz desta área, as respostas marcadas aqui se perdem ao recarregar.';

/** A frase para a rota atual, ou null fora das áreas restritas (a Júri entra: é restrita). */
export function avisoQuizDoCaminho(curriculo: Curriculo, caminho: string): string | null {
  return caminhoEmAreaRestrita(curriculo, caminho) ? FRASE_QUIZ_AREA_RESTRITA : null;
}
