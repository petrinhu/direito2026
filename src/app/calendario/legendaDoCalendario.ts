import { rotuloCategoria } from '@/core/calendario/rotulos';
import type { CategoriaEvento } from '@/core/calendario/tipos';

/** Ordem da legenda: as cinco avaliações, depois feriado, prazo e semestre. */
const ORDEM: readonly CategoriaEvento[] = [
  'AV1',
  'AV2',
  'AV3',
  'chamada',
  'final',
  'feriado',
  'prazo',
  'semestre'
];

export interface ItemLegenda {
  categoria: CategoriaEvento;
  rotulo: string;
  classe: string;
}

export function legendaDoCalendario(): ItemLegenda[] {
  return ORDEM.map((categoria) => ({
    categoria,
    rotulo: rotuloCategoria(categoria),
    classe: `cal-cat-${categoria.toLowerCase()}`
  }));
}
