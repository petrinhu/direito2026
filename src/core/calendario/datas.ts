import type { DataIso } from './tipos';

/**
 * Fuso do calendário do curso. Recife não tem horário de verão, então o
 * dia de Recife é fixo em UTC-3, e contar pelo fuso do navegador daria o
 * dia errado para quem abre o site de outro fuso.
 */
export const FUSO_CALENDARIO = 'America/Recife';

const MILISSEGUNDOS_POR_DIA = 86_400_000;
const PADRAO_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function ehDataIso(valor: string): boolean {
  const m = PADRAO_ISO.exec(valor);
  if (!m) return false;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  const ms = Date.UTC(ano, mes - 1, dia);
  const d = new Date(ms);
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

export function dataIsoNoFuso(instante: Date, fuso: string = FUSO_CALENDARIO): DataIso {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(instante);
  const valor = (tipo: string): string => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

function paraUtc(iso: DataIso): number {
  if (!ehDataIso(iso)) throw new Error(`data inválida: ${iso}`);
  const [ano, mes, dia] = iso.split('-').map(Number) as [number, number, number];
  return Date.UTC(ano, mes - 1, dia);
}

/** Dias de calendário entre duas datas ISO (fim menos início, em dias inteiros). */
export function diasEntre(origem: DataIso, destino: DataIso): number {
  return Math.round((paraUtc(destino) - paraUtc(origem)) / MILISSEGUNDOS_POR_DIA);
}

export function mesDe(iso: DataIso): string {
  return iso.slice(0, 7);
}

/** Soma dias corridos a uma data ISO (negativo volta no tempo). */
export function somarDias(iso: DataIso, dias: number): DataIso {
  const d = new Date(paraUtc(iso) + dias * MILISSEGUNDOS_POR_DIA);
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Último dia do mês AAAA-MM, em ISO. */
export function ultimoDiaDoMes(mes: string): DataIso {
  const [ano, m] = mes.split('-').map(Number) as [number, number];
  const ultimo = new Date(Date.UTC(ano, m, 0)).getUTCDate();
  return `${mes}-${String(ultimo).padStart(2, '0')}`;
}
