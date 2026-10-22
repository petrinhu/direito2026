import { lerIdDeUnidade, rotuloDaAv } from './idDeUnidade';
import type { Cadeira, ReferenciaUnidade } from './tipos';

/** Grupo de uma AV com os tópicos que ele tem (lista vazia = em breve). */
export interface GrupoNaAv {
  readonly id: string;
  readonly rotulo: string;
  readonly topicos: readonly ReferenciaUnidade[];
}

/**
 * Um item do menu da cadeira: uma unidade simples, ou uma AV com grupos. A AV
 * existe mesmo sem tópico, desde que tenha grupo declarado em cadeira.ts.
 */
export type ItemDaCadeira =
  | { readonly tipo: 'unidade'; readonly chave: string; readonly unidade: ReferenciaUnidade }
  | {
      readonly tipo: 'av';
      readonly chave: string;
      readonly numero: number;
      readonly rotulo: string;
      readonly grupos: readonly GrupoNaAv[];
    };

/** Itens da cadeira em ordem de número; grupos na ordem em que cadeira.ts os declara. */
export function itensDaCadeira(cadeira: Cadeira): ItemDaCadeira[] {
  const declarados = cadeira.grupos ?? [];
  const simples: ItemDaCadeira[] = cadeira.unidades
    .filter((unidade) => lerIdDeUnidade(unidade.id)?.grupo === undefined)
    .map((unidade) => ({
      tipo: 'unidade',
      chave: unidade.id,
      unidade
    }));

  const numerosDeAv = [
    ...new Set(declarados.map((grupo) => lerIdDeUnidade(grupo.unidade)?.numero ?? 0))
  ].filter((numero) => numero > 0);

  const avs: ItemDaCadeira[] = numerosDeAv.map((numero) => ({
    tipo: 'av',
    chave: `av-${numero}`,
    numero,
    rotulo: rotuloDaAv(numero),
    grupos: declarados
      .filter((grupo) => grupo.unidade === `u${numero}`)
      .map((grupo) => ({
        id: grupo.id,
        rotulo: grupo.rotulo,
        topicos: cadeira.unidades.filter((unidade) => {
          const id = lerIdDeUnidade(unidade.id);
          return id?.numero === numero && id.grupo === grupo.id;
        })
      }))
  }));

  return [...simples, ...avs].sort((a, b) => numeroDoItem(a) - numeroDoItem(b));
}

function numeroDoItem(item: ItemDaCadeira): number {
  return item.tipo === 'av' ? item.numero : (lerIdDeUnidade(item.unidade.id)?.numero ?? 0);
}
