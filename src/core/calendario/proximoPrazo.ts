import { diasEntre } from './datas';
import type { DataIso, PrazoDoCalendario, ProximoPrazo } from './tipos';

/**
 * Prazo mais próximo a partir de `hoje` (inclusive). Um prazo que já passou
 * não conta. Devolve `undefined` quando nenhum prazo é futura.
 */
export function proximoPrazo(
  prazos: readonly PrazoDoCalendario[],
  hoje: DataIso
): ProximoPrazo | undefined {
  const futuros = prazos.filter((p) => p.data >= hoje);
  if (futuros.length === 0) return undefined;
  const maisProximo = futuros.reduce((menor, p) => (p.data < menor.data ? p : menor));
  return {
    data: maisProximo.data,
    dias: diasEntre(hoje, maisProximo.data),
    descricao: maisProximo.descricao
  };
}
