import type { Curriculo, ReferenciaUnidade } from '@/core/curriculo/tipos';
import { lerIdDeUnidade } from '@/app/curriculo/idDeUnidade';

/**
 * Ids dos nós do menu que levam à página atual, em ordem de cima para baixo:
 * período, cadeira, AV, grupo, unidade (ou tópico), e a aba quando a página é
 * Petição ou o Resumo (a URL da unidade). Os ids seguem o esquema de
 * MenuCurriculo.vue (p-, c-, av-, g-, u-, ab-).
 */
export interface CadeiaDoCaminho {
  readonly ids: readonly string[];
  /** Unidade (ou tópico) da página atual, para carregar o conteúdo das abas. */
  readonly unidade?: ReferenciaUnidade;
  /** Chave da unidade no menu (periodo/cadeira/unidade). */
  readonly chave?: string;
}

const VAZIA: CadeiaDoCaminho = { ids: [] };

export function cadeiaDoCaminho(curriculo: Curriculo, caminho: string): CadeiaDoCaminho {
  const [raiz, periodoId, cadeiraId, unidadeId, aba] = caminho.split('/');
  if (raiz !== 'p' || !periodoId) return VAZIA;
  const periodo = curriculo.find((p) => p.id === periodoId);
  if (!periodo) return VAZIA;
  const ids = [`p-${periodo.id}`];
  if (!cadeiraId) return { ids };
  const cadeira = periodo.cadeiras.find((c) => c.id === cadeiraId);
  if (!cadeira) return { ids };
  ids.push(`c-${cadeira.id}`);
  if (!unidadeId) return { ids };
  const unidade = cadeira.unidades.find((u) => u.id === unidadeId);
  if (!unidade) return { ids };

  const chave = `${periodo.id}/${cadeira.id}/${unidade.id}`;
  const id = lerIdDeUnidade(unidade.id);
  if (id?.grupo !== undefined) {
    const avChave = `av-${id.numero}`;
    ids.push(`av-${periodo.id}/${cadeira.id}/${avChave}`);
    const grupo = cadeira.grupos?.find((g) => g.unidade === `u${id.numero}` && g.id === id.grupo);
    if (grupo) ids.push(`g-${periodo.id}/${cadeira.id}/${avChave}-${grupo.id}`);
  }
  ids.push(`u-${chave}`);
  if (aba === undefined && unidade.abas.includes('resumo')) ids.push(`ab-resumo-${chave}`);
  if (aba === 'peticao') ids.push(`ab-peticao-${chave}`);
  return { ids, unidade, chave };
}
