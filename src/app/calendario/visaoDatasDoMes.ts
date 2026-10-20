import { datasDoMes } from './eventosDoCalendario';
import { rotuloDeData } from './rotuloDeData';
import type { DataIso } from '@/core/calendario/tipos';

export interface VisaoDataDoMes {
  data: DataIso;
  rotulo: string;
  quantidade: number;
}

/** Lista do mês para teclado: uma entrada por dia que tem evento. */
export function visaoDatasDoMes(mes: string): VisaoDataDoMes[] {
  return datasDoMes(mes).map((d) => ({
    data: d.data,
    rotulo: rotuloDeData(d.data),
    quantidade: d.eventos.length
  }));
}
