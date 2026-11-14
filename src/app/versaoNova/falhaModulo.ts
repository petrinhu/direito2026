import type {
  ArmazenamentoRecarga,
  EventoFalhaModulo
} from '@/app/atualizacaoSW/recarregarAoFalharModulo';
import type { ResultadoConsulta } from './consultarVersaoPublicada';

/**
 * Módulo que falta depois de uma publicação (AV-F11, D2b opção A, ratificada pelo líder):
 * em vez de recarregar sozinho, mostra o banner, se houver versão nova confirmada e não
 * dispensada. Sem isso, recarrega como antes. A marca de laço (armazenamento) vale nos dois
 * caminhos: uma segunda falha em sequência não consulta nem recarrega.
 */
export interface DepsFalhaModulo {
  daAba: string;
  dispensadaPara: () => string | null;
  consultar: () => Promise<ResultadoConsulta>;
  armazenamento: ArmazenamentoRecarga;
  recarregar: () => void;
}

export type DesfechoFalhaModulo = 'banner' | 'recarregou' | 'ignorou';

export async function tratarFalhaDeModulo(deps: DepsFalhaModulo): Promise<DesfechoFalhaModulo> {
  if (deps.armazenamento.lerMarcaRecente()) return 'ignorou';
  const resultado = await consultarSemFalhar(deps.consultar);
  const mostrarBanner =
    resultado.tipo === 'publicada' &&
    resultado.versao !== deps.daAba &&
    resultado.versao !== deps.dispensadaPara();
  if (mostrarBanner) return 'banner';
  deps.armazenamento.gravarMarca();
  deps.recarregar();
  return 'recarregou';
}

/** Tratador para o evento vite:preloadError: cancela o padrão antes de decidir. */
export function criarTratadorDeFalhaDeModulo(
  deps: DepsFalhaModulo
): (evento: EventoFalhaModulo) => void {
  return (evento) => {
    evento.preventDefault?.();
    void tratarFalhaDeModulo(deps);
  };
}

async function consultarSemFalhar(
  consultar: () => Promise<ResultadoConsulta>
): Promise<ResultadoConsulta> {
  try {
    return await consultar();
  } catch {
    return { tipo: 'sem-informacao' };
  }
}
