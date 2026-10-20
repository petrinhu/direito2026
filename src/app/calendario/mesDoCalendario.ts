/** Mês AAAA-MM de uma data local (a que a grade está mostrando). */
export function mesDoCalendario(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${data.getFullYear()}-${mes}`;
}
