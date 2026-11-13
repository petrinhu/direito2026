import type { RegistroProgressoUnidade } from '@/core/progresso/tipos';

/**
 * Rodada finalizada que ganhou pergunta nova volta a ficar em andamento (decisão do
 * líder, 13/11/2026: reabrir só as novas). Só conta pergunta que NÃO estava na rodada
 * finalizada e que ainda não tem resposta. Sem a lista da rodada, não reabre.
 */
export function deveReabrirRodada(
  registro: Pick<RegistroProgressoUnidade, 'quizFinalizado' | 'quizIdsDaRodada' | 'quizRespostasOriginais'>,
  idsAtuais: readonly number[]
): boolean {
  if (registro.quizFinalizado !== true || registro.quizIdsDaRodada === undefined) return false;
  const jaNaRodada = new Set(registro.quizIdsDaRodada);
  const respostas = registro.quizRespostasOriginais ?? {};
  return idsAtuais.some((id) => !jaNaRodada.has(id) && respostas[id] === undefined);
}
