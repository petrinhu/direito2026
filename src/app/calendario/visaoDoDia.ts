import { eventosDaData } from './eventosDoCalendario';
import { dataPorExtenso } from './dataPorExtenso';
import { visaoDoEvento, type VisaoEvento } from './visaoEvento';
import type { DataIso } from '@/core/calendario/tipos';

export interface VisaoDoDia {
  titulo: string;
  itens: VisaoEvento[];
}

/** Painel de descrições: o dia por extenso e a lista do que acontece nele. */
export function visaoDoDia(data: DataIso): VisaoDoDia {
  return {
    titulo: dataPorExtenso(data),
    itens: eventosDaData(data).map(visaoDoEvento)
  };
}
