import { descricaoDasProvas } from './descricaoProvas';
import type { ProximaProva } from './tipos';

/**
 * Frase do quadro de contagem: "Faltam 35 dias para a 3ª AV de Introdução ao
 * Direito", "É amanhã: ..." e "É hoje: ...". Um dia é "amanhã" (a forma
 * singular "Falta 1 dia" não é usada, porque "É amanhã" a substitui).
 */
export function textoContador(proxima: ProximaProva): string {
  const descricao = descricaoDasProvas(proxima.provas);
  if (proxima.dias === 0) return `É hoje: ${descricao}`;
  if (proxima.dias === 1) return `É amanhã: ${descricao}`;
  return `Faltam ${proxima.dias} dias para ${descricao}`;
}
