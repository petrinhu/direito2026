export interface DispositivoLegal {
  /** Identificador estável citado no conteúdo. Ex.: 'cc-186', 'cpc-319-ii'. */
  readonly id: string;
  /** Nome por extenso. Ex.: 'Código Civil'. */
  readonly diploma: string;
  /** Sigla usada no rótulo curto. Ex.: 'CC'. */
  readonly diplomaSigla: string;
  /** Número do artigo, como texto. Ex.: '186', '5º'. */
  readonly artigo: string;
  /** Inciso, quando a citação é de um inciso e não do caput. Ex.: 'II'. */
  readonly inciso?: string;
  /** Redação oficial, verbatim, como está na fonte. */
  readonly texto: string;
  /** URL da fonte oficial consultada. */
  readonly urlFonte: string;
  /** ISO 8601. Data em que a fonte foi consultada. */
  readonly dataConsulta: string;
  /** Nota sobre alteração, revogação ou redação dada por lei posterior. */
  readonly notaAlteracao?: string;
}

/** Forma do arquivo entregue pela verificação jurídica: lista. */
export type CatalogoDispositivos = readonly DispositivoLegal[];

/** Forma consumida em runtime: indexada por id, montada no build. */
export type IndiceDispositivos = Readonly<Record<string, DispositivoLegal>>;

/** Os sete campos obrigatórios por dispositivo (seção 4.3 da arquitetura). */
export const CAMPOS_OBRIGATORIOS_DISPOSITIVO = [
  'id',
  'diploma',
  'diplomaSigla',
  'artigo',
  'texto',
  'urlFonte',
  'dataConsulta'
] as const;
