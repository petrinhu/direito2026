import { somarDias, ultimoDiaDoMes } from './datas';
import type { DatasComEventos, Evento } from './tipos';

/**
 * Dias de um mês AAAA-MM que têm algum evento, em ordem. Um período que
 * atravessa meses entra só nos dias do mês pedido.
 */
export function datasComEventosDoMes(eventos: readonly Evento[], mes: string): DatasComEventos[] {
  const primeiro = `${mes}-01`;
  const ultimo = ultimoDiaDoMes(mes);
  const porData = new Map<string, Evento[]>();

  for (const evento of eventos) {
    const inicio = evento.inicio > primeiro ? evento.inicio : primeiro;
    const fim = evento.fim < ultimo ? evento.fim : ultimo;
    for (let dia = inicio; dia <= fim; dia = somarDias(dia, 1)) {
      const lista = porData.get(dia) ?? [];
      lista.push(evento);
      porData.set(dia, lista);
    }
  }

  return [...porData.keys()].sort().map((data) => ({ data, eventos: porData.get(data) ?? [] }));
}
