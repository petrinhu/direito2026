import type { DataIso } from '@/core/calendario/tipos';

/** "terça-feira, 20 de outubro de 2026", lido em UTC para não mudar o dia. */
export function dataPorExtenso(iso: DataIso): string {
  const [ano, mes, dia] = iso.split('-').map(Number) as [number, number, number];
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(ano, mes - 1, dia)));
}
