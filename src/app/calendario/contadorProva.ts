import { PRAZOS_2026_2, PROVAS_2026_2 } from '@/conteudo/calendario/provas';
import { nivelUrgencia } from '@/core/calendario/urgencia';
import { proximaProva } from '@/core/calendario/proximaProva';
import { proximoPrazo } from '@/core/calendario/proximoPrazo';
import { textoContador, textoDoContador } from '@/core/calendario/textoContador';
import { dataDeHoje } from './dataDeHoje';
import type { DataIso, NivelUrgencia, PrazoDoCalendario, Prova } from '@/core/calendario/tipos';

export interface ContadorProva {
  /** Data do que o contador conta (uma prova ou um prazo). */
  data: DataIso;
  dias: number;
  faixa: NivelUrgencia;
  texto: string;
}

/**
 * Contagem para o quadro flutuante: o que vem primeiro a partir de `agora`, no
 * dia de Recife, entre as provas e os prazos (ex.: o fim das provas online).
 * Empate no mesmo dia: a prova vence. Sem nada futuro, não há contador (undefined).
 */
export function contadorProva(
  agora: Date,
  provas: readonly Prova[] = PROVAS_2026_2,
  prazos: readonly PrazoDoCalendario[] = PRAZOS_2026_2
): ContadorProva | undefined {
  const hoje = dataDeHoje(agora);
  const prova = proximaProva(provas, hoje);
  const prazo = proximoPrazo(prazos, hoje);

  if (prazo && (!prova || prazo.dias < prova.dias)) {
    return {
      data: prazo.data,
      dias: prazo.dias,
      faixa: nivelUrgencia(prazo.dias),
      texto: textoDoContador(prazo.dias, prazo.descricao)
    };
  }
  if (!prova) return undefined;
  return {
    data: prova.data,
    dias: prova.dias,
    faixa: nivelUrgencia(prova.dias),
    texto: textoContador(prova)
  };
}
