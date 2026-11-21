import { FUSO_CALENDARIO } from './datas';

/**
 * Data e hora de um instante, em dd/mm/aaaa HH:MM:SS, no fuso do calendário (não no do navegador).
 * Sem valor, "Nunca"; texto que não é data volta igual, como o painel já fazia.
 */
export function formatarDataHora(valor: string | null): string {
  if (!valor) return 'Nunca';
  const instante = new Date(valor);
  if (Number.isNaN(instante.getTime())) return valor;
  const campo = camposNoFuso(instante, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  return `${campo('day')}/${campo('month')}/${campo('year')} ${normalizarHora24(campo('hour'))}:${campo('minute')}:${campo('second')}`;
}

/** Só a hora de um instante, em HH:MM:SS, no fuso do calendário. */
export function formatarHora(instante: Date): string {
  const campo = camposNoFuso(instante, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${normalizarHora24(campo('hour'))}:${campo('minute')}:${campo('second')}`;
}

/** Algumas combinações de motor e locale devolvem a meia-noite como "24"; o certo é "00". */
export function normalizarHora24(hora: string): string {
  return hora === '24' ? '00' : hora;
}

/** Devolve o valor de um campo (day, hour...) do instante no fuso do calendário; campo ausente vira "". */
function camposNoFuso(
  instante: Date,
  campos: Pick<Intl.DateTimeFormatOptions, 'day' | 'month' | 'year' | 'hour' | 'minute' | 'second'>
): (tipo: string) => string {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_CALENDARIO,
    ...campos,
    hourCycle: 'h23'
  }).formatToParts(instante);
  return (tipo) => partes.find((p) => p.type === tipo)?.value ?? '';
}
