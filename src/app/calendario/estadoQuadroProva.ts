import type { NivelUrgencia } from '@/core/calendario/tipos';

export const CHAVE_ESTADO_QUADRO_PROVA = 'caderno-direito:quadro-prova';

/** Só o que o quadro usa do armazenamento (localStorage ou um substituto). */
export interface ArmazenamentoSimples {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
}

interface EstadoGuardado {
  minimizado: boolean;
  faixa: NivelUrgencia;
}

function lerGuardado(armazenamento: ArmazenamentoSimples | undefined): EstadoGuardado | undefined {
  try {
    const bruto = armazenamento?.getItem(CHAVE_ESTADO_QUADRO_PROVA);
    if (!bruto) return undefined;
    const valor: unknown = JSON.parse(bruto);
    if (typeof valor !== 'object' || valor === null) return undefined;
    const { minimizado, faixa } = valor as Partial<EstadoGuardado>;
    if (typeof minimizado !== 'boolean' || typeof faixa !== 'string') return undefined;
    return { minimizado, faixa: faixa as NivelUrgencia };
  } catch {
    return undefined;
  }
}

/**
 * Minimizado só vale na mesma faixa de urgência em que foi guardado. Ao
 * mudar de faixa o quadro reabre sozinho (ordem do líder, 20/10/2026).
 * Armazenamento ausente, bloqueado ou corrompido resulta em "aberto".
 */
export function lerMinimizado(
  armazenamento: ArmazenamentoSimples | undefined,
  faixaAtual: NivelUrgencia
): boolean {
  const guardado = lerGuardado(armazenamento);
  return guardado !== undefined && guardado.minimizado && guardado.faixa === faixaAtual;
}

export function gravarMinimizado(
  armazenamento: ArmazenamentoSimples | undefined,
  faixa: NivelUrgencia,
  minimizado: boolean
): void {
  try {
    const estado: EstadoGuardado = { minimizado, faixa };
    armazenamento?.setItem(CHAVE_ESTADO_QUADRO_PROVA, JSON.stringify(estado));
  } catch {
    // Armazenamento bloqueado: o quadro segue funcionando, só não lembra.
  }
}
