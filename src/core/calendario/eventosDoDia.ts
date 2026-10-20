import type { DataIso, Evento } from './tipos';

/** Eventos que cobrem a data, inclusive os de período, na ordem da lista. */
export function eventosDoDia(eventos: readonly Evento[], data: DataIso): Evento[] {
  return eventos.filter((e) => e.inicio <= data && data <= e.fim);
}
