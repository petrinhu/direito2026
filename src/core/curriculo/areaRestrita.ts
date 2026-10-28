import type { Cadeira, Curriculo } from './tipos';

/** A cadeira de um caminho `/p/:periodo/:cadeira[/...]`, ou undefined se não houver uma. */
function cadeiraDoCaminho(curriculo: Curriculo, caminho: string): Cadeira | undefined {
  const [raiz, periodoId, cadeiraId] = caminho.split('/').filter((p) => p.length > 0);
  if (raiz !== 'p' || !periodoId || !cadeiraId) return undefined;
  return curriculo.find((p) => p.id === periodoId)?.cadeiras.find((c) => c.id === cadeiraId);
}

/**
 * Verdadeiro quando o caminho é uma cadeira restrita (qualquer área) ou algo abaixo
 * dela. Função pura (camada Back): quem decide o que muda nessas rotas é a camada de
 * cima. O aviso de cookies e o quadro de prova usam esta, porque valem para todas.
 */
export function caminhoEmAreaRestrita(curriculo: Curriculo, caminho: string): boolean {
  return cadeiraDoCaminho(curriculo, caminho)?.restrita === true;
}

/**
 * Verdadeiro quando o caminho é uma cadeira restrita que suspende o modo adaptado: a do
 * Interdisciplinar (ordem do líder, 05/10/2026). A Júri mantém o modo (decisão do CTO,
 * pendente de ratificação). Uma área nova entra aqui só com decisão própria.
 */
export function caminhoSuspendeModoAdaptado(curriculo: Curriculo, caminho: string): boolean {
  const cadeira = cadeiraDoCaminho(curriculo, caminho);
  return cadeira?.restrita === true && cadeira.area !== 'juri';
}
