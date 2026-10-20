import { agruparPorUnidade } from '@/core/curriculo/agruparPorUnidade';
import type { RegistroDeCarregadores } from './decorarCurriculo';
import { montarCarregadores } from './montarCarregadores';
import { CAMINHOS_DO_CONTEUDO, importarDoConteudo } from './modulosDoConteudo';

/**
 * Um carregador por unidade descoberta em src/conteudo/ (glob do Vite). Antes
 * esta lista era escrita à mão; agora a pasta de cada unidade é a fonte: uma
 * unidade nova entra sozinha, e uma pasta fora do formato reprova em
 * agruparPorUnidade, com o nome da unidade.
 */
export const CARREGADORES: RegistroDeCarregadores = montarCarregadores(
  agruparPorUnidade(CAMINHOS_DO_CONTEUDO),
  importarDoConteudo
);
