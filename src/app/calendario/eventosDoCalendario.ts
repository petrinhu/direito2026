import { FERIADOS_2026_2 } from '@/conteudo/calendario/feriados';
import {
  EVENTOS_ACADEMICOS_2026_2,
  OBSERVACOES_ACADEMICAS_2026_2
} from '@/conteudo/calendario/calendarioAcademico';
import { PERIODO_PROVAS_ONLINE_2026_2, PROVAS_2026_2 } from '@/conteudo/calendario/provas';
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
    ...PROVAS_2026_2.map(provaComoEvento),
    PERIODO_PROVAS_ONLINE_2026_2,
    ...FERIADOS_2026_2,
    ...EVENTOS_ACADEMICOS_2026_2
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
  return OBSERVACOES_ACADEMICAS_2026_2;
}
