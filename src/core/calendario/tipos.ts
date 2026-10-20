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

/** Semestre letivo no formato AAAA.N (ex.: '2026.2'). Todo item de dado do calendário traz o seu. */
export type Semestre = string;

/** Prova como está no dado: só o id da cadeira. O nome sai do currículo (resolverProvas). */
export interface ProvaDoSemestre {
  semestre: Semestre;
  data: DataIso;
  cadeiraId: string;
  tipo: TipoProva;
}

export interface EventoDoSemestre extends Evento {
  semestre: Semestre;
}

export interface PrazoDoSemestre extends PrazoDoCalendario {
  semestre: Semestre;
}

export interface ObservacaoDoSemestre {
  semestre: Semestre;
  texto: string;
}

/** Lista fechada de tipos de prova: o validador e a legenda leem daqui. */
export const TIPOS_PROVA: readonly TipoProva[] = ['AV1', 'AV2', 'AV3', 'chamada', 'final'];

/** Lista fechada de categorias de evento. Adicionar uma categoria exige rótulo em rotulos.ts. */
export const CATEGORIAS_EVENTO: readonly CategoriaEvento[] = [
  'AV1',
  'AV2',
  'AV3',
  'chamada',
  'final',
  'online',
  'feriado',
  'prazo',
  'semestre'
];
