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
  /**
   * Verdadeiro quando a pessoa tocou em Mostrar/Minimizar; falso quando o
   * registro é só o reset automático de faixa. Ausente no formato antigo, que
   * só o toque gravava, então conta como escolha.
   */
  escolha?: boolean;
}

function lerGuardado(armazenamento: ArmazenamentoSimples | undefined): EstadoGuardado | undefined {
  try {
    const bruto = armazenamento?.getItem(CHAVE_ESTADO_QUADRO_PROVA);
    if (!bruto) return undefined;
    const valor: unknown = JSON.parse(bruto);
    if (typeof valor !== 'object' || valor === null) return undefined;
    const { minimizado, faixa, escolha } = valor as Partial<EstadoGuardado>;
    if (typeof minimizado !== 'boolean' || typeof faixa !== 'string') return undefined;
    return {
      minimizado,
      faixa: faixa as NivelUrgencia,
      escolha: typeof escolha === 'boolean' ? escolha : undefined
    };
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

/**
 * Escolha da pessoa na faixa atual: `true` ou `false` quando ela tocou em
 * Minimizar ou Mostrar nesta faixa; `undefined` quando não tocou (nada
 * guardado, outra faixa, reset automático de faixa ou armazenamento falho).
 */
export function lerEscolha(
  armazenamento: ArmazenamentoSimples | undefined,
  faixaAtual: NivelUrgencia
): boolean | undefined {
  const guardado = lerGuardado(armazenamento);
  if (!guardado || guardado.faixa !== faixaAtual) return undefined;
  if (guardado.escolha === false) return undefined;
  return guardado.minimizado;
}

/** Grava o toque da pessoa (Mostrar ou Minimizar) na faixa atual. */
export function gravarEscolha(
  armazenamento: ArmazenamentoSimples | undefined,
  faixa: NivelUrgencia,
  minimizado: boolean
): void {
  try {
    const estado: EstadoGuardado = { minimizado, faixa, escolha: true };
    armazenamento?.setItem(CHAVE_ESTADO_QUADRO_PROVA, JSON.stringify(estado));
  } catch {
    // Armazenamento bloqueado: o quadro segue funcionando, só não lembra.
  }
}

/**
 * Reset automático de faixa: o quadro volta ao padrão e a faixa nova fica
 * registrada sem escolha da pessoa (escolha: false). Não é um toque.
 */
export function gravarSemEscolha(
  armazenamento: ArmazenamentoSimples | undefined,
  faixa: NivelUrgencia
): void {
  try {
    const estado: EstadoGuardado = { minimizado: false, faixa, escolha: false };
    armazenamento?.setItem(CHAVE_ESTADO_QUADRO_PROVA, JSON.stringify(estado));
  } catch {
    // Armazenamento bloqueado: nada a lembrar.
  }
}
