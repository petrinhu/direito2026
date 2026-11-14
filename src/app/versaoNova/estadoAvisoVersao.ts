import type { ResultadoConsulta } from './consultarVersaoPublicada';
import { LIMITE_CONTINUA_CONECTADO_MIN } from '@/core/versaoNova/limites';

/** Chaves de sessionStorage (plano 3.5 e pedido do líder de guardar a versão dispensada). */
export const CHAVE_DISPENSADA = 'caderno-direito:aviso-versao:dispensada';
export const CHAVE_RECARREGOU_PARA = 'caderno-direito:aviso-versao:recarregou-para';

export type EstadoAviso =
  | { tipo: 'oculto' }
  | { tipo: 'versao-nova'; publicada: string };

export interface EntradaEstado {
  daAba: string;
  resultado: ResultadoConsulta | null;
  dispensadaPara: string | null;
  recarregouPara: string | null;
}

/**
 * Estado do banner a partir da última consulta. Mostra só quando a publicada é diferente da
 * aba, ainda não foi dispensada e não é o laço de recarga (anti-laço, plano 3.5). Sessão
 * terminada e sem informação escondem o banner.
 */
export function decidirEstadoAviso(entrada: EntradaEstado): EstadoAviso {
  const { resultado, daAba, dispensadaPara, recarregouPara } = entrada;
  if (resultado === null || resultado.tipo !== 'publicada') return { tipo: 'oculto' };
  const { versao: publicada } = resultado;
  if (publicada === daAba) return { tipo: 'oculto' };
  if (publicada === dispensadaPara) return { tipo: 'oculto' };
  if (publicada === recarregouPara) {
    console.warn(`aviso de versão: a aba segue em ${daAba}, mas já se recarregou para ${publicada}`);
    return { tipo: 'oculto' };
  }
  return { tipo: 'versao-nova', publicada };
}

const MINUTO_MS = 60_000;

/**
 * "e continua conectado" só aparece se a última consulta com 200 foi há menos de 110 min
 * (plano 3.5; o servidor derruba a sessão com 7200 s de ociosidade).
 */
export function continuaConectado(ultimaConfirmacaoMs: number | null, agoraMs: number): boolean {
  if (ultimaConfirmacaoMs === null) return false;
  return agoraMs - ultimaConfirmacaoMs < LIMITE_CONTINUA_CONECTADO_MIN * MINUTO_MS;
}

export interface DepsClique {
  versaoPublicada: string;
  consultar: () => Promise<ResultadoConsulta>;
  marcarRecarregouPara: (versao: string) => void;
  navegar: () => void;
}

/**
 * Clique em "Recarregar a página": faz UMA consulta antes de navegar (plano 3.5, D8).
 * 401/403 não navegam e devolvem sessão terminada; rede ou 200 navegam para a Home. A marca
 * vai antes da navegação, para o anti-laço.
 */
export async function aoClicarRecarregar(
  deps: DepsClique
): Promise<'navegou' | 'sessao-terminada'> {
  let resultado: ResultadoConsulta;
  try {
    resultado = await deps.consultar();
  } catch {
    resultado = { tipo: 'sem-informacao' };
  }
  if (resultado.tipo === 'sessao-terminada') return 'sessao-terminada';
  deps.marcarRecarregouPara(deps.versaoPublicada);
  deps.navegar();
  return 'navegou';
}

/** Reexportação para a camada de ui (ui não importa core direto: regra ui-nao-pula-app). */
export { textoDoAviso } from '@/core/versaoNova/textoDoAviso';
