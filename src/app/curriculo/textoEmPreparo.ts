import type { Periodo } from '@/core/curriculo/tipos';

/**
 * Linha única da home sobre os períodos sem material. Os números vêm do
 * currículo (nunca escritos à mão), e o intervalo vai do menor ao maior
 * período em preparo.
 */
export function textoEmPreparo(emPreparo: readonly Periodo[]): string | null {
  if (emPreparo.length === 0) return null;
  const numeros = emPreparo.map((p) => p.numero);
  if (emPreparo.length === 1) {
    return `${numeros[0]}º período: material em preparação.`;
  }
  const menor = Math.min(...numeros);
  const maior = Math.max(...numeros);
  return `Do ${menor}º ao ${maior}º período: material em preparação.`;
}
