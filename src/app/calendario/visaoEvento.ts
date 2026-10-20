import { rotuloCategoria } from '@/core/calendario/rotulos';
import type { Evento } from '@/core/calendario/tipos';

/** O que o painel precisa para mostrar um evento: texto pronto e classe de cor. */
export interface VisaoEvento {
  chave: string;
  rotulo: string;
  classe: string;
  titulo: string;
  descricao: string;
}

export function visaoDoEvento(evento: Evento, indice: number): VisaoEvento {
  return {
    chave: `${evento.categoria}-${evento.inicio}-${indice}`,
    rotulo: rotuloCategoria(evento.categoria),
    classe: `cal-cat-${evento.categoria.toLowerCase()}`,
    titulo: evento.titulo,
    descricao: evento.descricao
  };
}
