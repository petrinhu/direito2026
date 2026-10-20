import type { Prova, ProvaDoSemestre } from './tipos';

export interface CadeiraDoCurriculo {
  readonly id: string;
  readonly nome: string;
}

/**
 * Transforma as provas do dado (só o id da cadeira) em Prova, com o nome vindo
 * do currículo. Id desconhecido lança: uma prova sem nome não deve aparecer.
 */
export function resolverProvas(
  provas: readonly ProvaDoSemestre[],
  cadeiras: readonly CadeiraDoCurriculo[]
): Prova[] {
  const nomes = new Map(cadeiras.map((cadeira) => [cadeira.id, cadeira.nome]));
  return provas.map((prova) => {
    const cadeiraNome = nomes.get(prova.cadeiraId);
    if (cadeiraNome === undefined) {
      throw new Error(
        `prova sem cadeira no currículo: cadeiraId desconhecido "${prova.cadeiraId}"`
      );
    }
    return { data: prova.data, cadeiraId: prova.cadeiraId, cadeiraNome, tipo: prova.tipo };
  });
}
