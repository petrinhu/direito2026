import type { Curriculo, Periodo } from '@/core/curriculo/tipos';

export interface PeriodosSeparados {
  /** Períodos com ao menos uma cadeira publicada: ganham seção na home. */
  readonly comMaterial: readonly Periodo[];
  /** Os demais: entram só na linha "material em preparação". */
  readonly emPreparo: readonly Periodo[];
}

export function separarPeriodos(curriculo: Curriculo): PeriodosSeparados {
  const comMaterial: Periodo[] = [];
  const emPreparo: Periodo[] = [];
  for (const periodo of curriculo) {
    const temPublicada = periodo.cadeiras.some((c) => c.estado === 'publicado');
    (temPublicada ? comMaterial : emPreparo).push(periodo);
  }
  return { comMaterial, emPreparo };
}
