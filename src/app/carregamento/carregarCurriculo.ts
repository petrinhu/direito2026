import type { Curriculo } from '@/core/curriculo/tipos';
import { decorarCurriculo } from './decorarCurriculo';
import { CARREGADORES } from './carregadores';

/**
 * Ponto único de composição entre o dado (src/conteudo/curriculo.ts) e os
 * carregadores sob demanda (src/app/carregamento/carregadores.ts). É a
 * única função que o router chama para obter o currículo pronto para uso.
 */
export async function carregarCurriculo(): Promise<Curriculo> {
  const { curriculo } = await import('@/conteudo/curriculo');
  return decorarCurriculo(curriculo, CARREGADORES);
}
