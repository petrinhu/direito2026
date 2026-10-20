/** Data no formato AAAA-MM-DD, sempre no calendário de Recife (sem hora). */
export type DataIso = string;

/** Tipos de prova que a faculdade aplica, por cadeira. */
export type TipoProva = 'AV1' | 'AV2' | 'AV3' | 'chamada' | 'final';

export type CategoriaEvento = TipoProva | 'online' | 'feriado' | 'prazo' | 'semestre';

export interface Prova {
  data: DataIso;
  cadeiraId: string;
  cadeiraNome: string;
  tipo: TipoProva;
}

/** Evento de um ou mais dias (inicio e fim iguais quando é um dia só). */
export interface Evento {
  inicio: DataIso;
  fim: DataIso;
  categoria: CategoriaEvento;
  titulo: string;
  descricao: string;
}

export type NivelUrgencia = 'calmo' | 'dourado' | 'garnet' | 'pulsante';

/** Prazo que vale para o contador além das provas (ex.: o fim de um período de provas online). */
export interface PrazoDoCalendario {
  data: DataIso;
  /** Frase que completa o contador: "Faltam N dias para <descricao>". */
  descricao: string;
}

export interface ProximoPrazo {
  data: DataIso;
  dias: number;
  descricao: string;
}

export interface ProximaProva {
  data: DataIso;
  dias: number;
  provas: Prova[];
}

export interface DatasComEventos {
  data: DataIso;
  eventos: Evento[];
}
