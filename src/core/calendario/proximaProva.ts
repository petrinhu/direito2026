import { diasEntre } from './datas';
import type { DataIso, ProximaProva, Prova } from './tipos';

/**
 * Próxima data de prova a partir de `hoje` (inclusive). Devolve as provas
 * daquele dia agrupadas, ou `undefined` quando nenhuma prova é futura.
 */
export function proximaProva(provas: readonly Prova[], hoje: DataIso): ProximaProva | undefined {
  const futuras = provas.filter((p) => p.data >= hoje);
  if (futuras.length === 0) return undefined;

  const data = futuras.reduce((menor, p) => (p.data < menor ? p.data : menor), futuras[0]!.data);
  return {
    data,
    dias: diasEntre(hoje, data),
    provas: futuras.filter((p) => p.data === data)
  };
}
