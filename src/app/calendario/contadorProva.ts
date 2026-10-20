import { PROVAS_2026_2 } from '@/conteudo/calendario/provas';
import { nivelUrgencia } from '@/core/calendario/urgencia';
import { proximaProva } from '@/core/calendario/proximaProva';
import { textoContador } from '@/core/calendario/textoContador';
import { dataDeHoje } from './dataDeHoje';
import type { NivelUrgencia, Prova, ProximaProva } from '@/core/calendario/tipos';

export interface ContadorProva {
  proxima: ProximaProva;
  dias: number;
  faixa: NivelUrgencia;
  texto: string;
}

/**
 * Contagem para o quadro flutuante: a próxima prova a partir de `agora`, no
 * dia de Recife. Sem prova futura, não há contador (undefined).
 */
export function contadorProva(
  agora: Date,
  provas: readonly Prova[] = PROVAS_2026_2
): ContadorProva | undefined {
  const proxima = proximaProva(provas, dataDeHoje(agora));
  if (!proxima) return undefined;
  return {
    proxima,
    dias: proxima.dias,
    faixa: nivelUrgencia(proxima.dias),
    texto: textoContador(proxima)
  };
}
