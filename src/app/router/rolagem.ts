import type { RouteLocationNormalized } from 'vue-router';

/** Preferência de movimento reduzido do sistema (WCAG 2.3.3). Consultada a cada troca de rota. */
export const CONSULTA_MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';

function pediuMenosMovimento(): boolean {
  return typeof matchMedia === 'function' && matchMedia(CONSULTA_MOVIMENTO_REDUZIDO).matches;
}

/**
 * Rolagem na troca de rota: âncora (hash) ou topo. A rolagem de âncora é suave, salvo com
 * movimento reduzido, quando rola de uma vez. A regra de transições de tokens.css segue como está.
 */
export function rolagemDaTroca(to: Pick<RouteLocationNormalized, 'hash'>) {
  if (to.hash) {
    const behavior: 'instant' | 'smooth' = pediuMenosMovimento() ? 'instant' : 'smooth';
    return { el: to.hash, behavior };
  }
  return { top: 0 };
}
