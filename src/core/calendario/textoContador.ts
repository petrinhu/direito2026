import { descricaoDasProvas } from './descricaoProvas';
import type { ProximaProva } from './tipos';

/**
 * Texto do contador para qualquer descrição (prova ou prazo): "Faltam 35 dias
 * para ...", "É amanhã: ..." e "É hoje: ...". Um dia é "amanhã" (a forma
 * singular "Falta 1 dia" não é usada, porque "É amanhã" a substitui).
 */
export function textoDoContador(dias: number, descricao: string): string {
  if (dias === 0) return `É hoje: ${descricao}`;
  if (dias === 1) return `É amanhã: ${descricao}`;
  return `Faltam ${dias} dias para ${descricao}`;
}

export function textoContador(proxima: ProximaProva): string {
  return textoDoContador(proxima.dias, descricaoDasProvas(proxima.provas));
}
