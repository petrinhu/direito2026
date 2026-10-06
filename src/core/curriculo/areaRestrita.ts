import type { Curriculo } from './tipos';

/**
 * Verdadeiro quando o caminho é a cadeira restrita ou qualquer coisa abaixo
 * dela. Função pura (camada Back): quem decide o que muda nessas rotas é a
 * camada de cima.
 */
export function caminhoEmAreaRestrita(curriculo: Curriculo, caminho: string): boolean {
  const [raiz, periodoId, cadeiraId] = caminho.split('/').filter((p) => p.length > 0);
  if (raiz !== 'p' || !periodoId || !cadeiraId) return false;
  const periodo = curriculo.find((p) => p.id === periodoId);
  return periodo?.cadeiras.find((c) => c.id === cadeiraId)?.restrita === true;
}
