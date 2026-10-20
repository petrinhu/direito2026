import type { MetaUnidade } from '../unidade/tipos';
import type { ErroDeUnidade } from './tipos';

/** Todo campo de meta.ts tem de ter texto: a unidade aparece no menu e na busca. */
export function validarMeta(meta: MetaUnidade): ErroDeUnidade[] {
  return Object.entries(meta).flatMap(([campo, valor]) =>
    typeof valor === 'string' && valor.trim() !== ''
      ? []
      : [{ regra: 'vazio' as const, caminho: `meta.${campo}`, detalhe: 'campo de meta vazio' }]
  );
}
