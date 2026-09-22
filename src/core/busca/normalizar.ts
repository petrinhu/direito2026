/**
 * Normaliza um termo para casamento de busca: minúsculas, sem diacríticos.
 * Usado dos dois lados (indexação e consulta), conforme seção 7 da
 * arquitetura. `normalize('NFD')` é seguro nos quatro motores-alvo.
 */
export function normalizarTermo(texto: string): string {
  return texto
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
