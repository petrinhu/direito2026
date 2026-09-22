import MiniSearch from 'minisearch';
import { normalizarTermo } from '@/core/busca/normalizar';
import type { DocumentoBusca, MotorBusca } from '@/core/busca/tipos';

/** Opções compartilhadas entre quem gera o índice (Node) e quem consulta (navegador). */
export const OPCOES_MINISEARCH = {
  fields: ['titulo', 'corpo'],
  storeFields: ['url', 'periodo', 'cadeira', 'unidade', 'aba', 'titulo', 'trecho'],
  searchOptions: {
    prefix: true,
    fuzzy: 0.2,
    boost: { titulo: 3 },
    combineWith: 'AND' as const
  },
  processTerm: (termo: string) => normalizarTermo(termo)
};

/** Adaptador concreto sobre MiniSearch, atrás da interface MotorBusca (seção 7). */
export function criarMotorBuscaMiniSearch(indice: readonly DocumentoBusca[]): MotorBusca {
  const mini = new MiniSearch<DocumentoBusca>(OPCOES_MINISEARCH);
  mini.addAll(indice as DocumentoBusca[]);

  return {
    consultar(termo: string): readonly DocumentoBusca[] {
      if (termo.trim() === '') return [];
      const resultados = mini.search(termo);
      return resultados
        .map((r) => indice.find((doc) => doc.id === r.id))
        .filter((doc): doc is DocumentoBusca => doc !== undefined);
    }
  };
}

/** Reconstitui o motor a partir do JSON serializado do índice (loadJSON, sem reindexar). */
export function carregarMotorBuscaDeJson(json: string): MotorBusca {
  const mini = MiniSearch.loadJSON<DocumentoBusca>(json, OPCOES_MINISEARCH);
  return {
    consultar(termo: string): readonly DocumentoBusca[] {
      if (termo.trim() === '') return [];
      return mini.search(termo) as unknown as readonly DocumentoBusca[];
    }
  };
}
