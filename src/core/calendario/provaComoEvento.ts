import { rotuloCategoria } from './rotulos';
import type { Evento, Prova, TipoProva } from './tipos';

const DESCRICAO_DO_TIPO: Record<TipoProva, string> = {
  AV1: 'Primeira avaliação',
  AV2: 'Segunda avaliação',
  AV3: 'Terceira avaliação',
  chamada: 'Prova de segunda chamada',
  final: 'Avaliação final'
};

/** Uma prova como evento de um dia só, para o painel de descrições. */
export function provaComoEvento(prova: Prova): Evento {
  return {
    inicio: prova.data,
    fim: prova.data,
    categoria: prova.tipo,
    titulo: `${rotuloCategoria(prova.tipo)}: ${prova.cadeiraNome}`,
    descricao: `${DESCRICAO_DO_TIPO[prova.tipo]} de ${prova.cadeiraNome}.`
  };
}

export function descricaoDoTipo(tipo: TipoProva): string {
  return DESCRICAO_DO_TIPO[tipo];
}
