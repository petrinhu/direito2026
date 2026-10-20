import type { DataIso } from '@/core/calendario/tipos';

/** "16 de outubro, sexta-feira": forma curta para botões da lista do mês. */
export function rotuloDeData(iso: DataIso): string {
  const [ano, mes, dia] = iso.split('-').map(Number) as [number, number, number];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const diaEMes = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  }).format(data);
  const diaDaSemana = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    timeZone: 'UTC'
  }).format(data);
  return `${diaEMes}, ${diaDaSemana}`;
}
