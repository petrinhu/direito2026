import { FUSO_CALENDARIO } from './datas';

/**
 * Data e hora de um instante, em dd/mm/aaaa HH:MM:SS, no fuso do calendário (não no do navegador).
 * Sem valor, "Nunca"; texto que não é data volta igual, como o painel já fazia.
 */
export function formatarDataHora(valor: string | null): string {
  if (!valor) return 'Nunca';
  const instante = new Date(valor);
  if (Number.isNaN(instante.getTime())) return valor;
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_CALENDARIO,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(instante);
  const campo = (tipo: string): string => partes.find((p) => p.type === tipo)?.value ?? '';
  const hora = normalizarHora24(campo('hour'));
  return `${campo('day')}/${campo('month')}/${campo('year')} ${hora}:${campo('minute')}:${campo('second')}`;
}

/** Algumas combinações de motor e locale devolvem a meia-noite como "24"; o certo é "00". */
export function normalizarHora24(hora: string): string {
  return hora === '24' ? '00' : hora;
}
