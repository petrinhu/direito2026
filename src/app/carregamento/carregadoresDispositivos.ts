import type { IndiceDispositivos } from '@/core/dispositivos/tipos';
import { agruparPorUnidade } from '@/core/curriculo/agruparPorUnidade';
import { montarCarregadoresDispositivos } from './montarCarregadores';
import { CAMINHOS_DO_CONTEUDO, importarDoConteudo } from './modulosDoConteudo';

export type RegistroDeCarregadoresDispositivos = Record<string, () => Promise<IndiceDispositivos>>;

/**
 * Prioridade zero (achado do líder, medido: em produção o balão de citação
 * legal não abria). Causa: import() com caminho montado em tempo de execução
 * não é visto pelo empacotador, e nenhum pedaço era gerado. Correção: o
 * carregador de cada unidade aponta para o arquivo de dispositivos achado pelo
 * glob, com caminho literal que o empacotador enxerga.
 */
export const CARREGADORES_DISPOSITIVOS: RegistroDeCarregadoresDispositivos =
  montarCarregadoresDispositivos(agruparPorUnidade(CAMINHOS_DO_CONTEUDO), importarDoConteudo);
