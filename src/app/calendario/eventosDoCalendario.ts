import {
  EVENTOS_ACADEMICOS,
  FERIADOS,
  OBSERVACOES_ACADEMICAS,
  PERIODOS_ONLINE,
  PROVAS
} from './dadosDoCalendario';
import { provaComoEvento } from '@/core/calendario/provaComoEvento';
import { eventosDoDia } from '@/core/calendario/eventosDoDia';
import { datasComEventosDoMes } from '@/core/calendario/datasDoMes';
import type { DatasComEventos, DataIso, Evento } from '@/core/calendario/tipos';

/**
 * Todos os eventos do semestre, cada prova como um evento de um dia, em
 * ordem de data. É a lista que alimenta o painel de descrições.
 */
export function todosOsEventos(): Evento[] {
  const eventos = [
    ...PROVAS.map(provaComoEvento),
    ...PERIODOS_ONLINE,
    ...FERIADOS,
    ...EVENTOS_ACADEMICOS
  ];
  return [...eventos].sort((a, b) => a.inicio.localeCompare(b.inicio));
}

export function eventosDaData(data: DataIso): Evento[] {
  return eventosDoDia(todosOsEventos(), data);
}

export function datasDoMes(mes: string): DatasComEventos[] {
  return datasComEventosDoMes(todosOsEventos(), mes);
}

export function observacoesDoCalendario(): readonly string[] {
  return OBSERVACOES_ACADEMICAS;
}
