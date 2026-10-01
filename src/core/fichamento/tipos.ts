/**
 * Dados que alimentam, ao mesmo tempo, o Mapa mental e o Fichamento de uma
 * unidade (uma fonte só, DRY). A hierarquia é Era > Fase > Pensador > ficha:
 * a era é o período histórico largo ("Idade Antiga"), a fase é a subdivisão
 * que ajuda a ordenar os pensadores ("Grécia clássica"), e o pensador carrega
 * o modo de pensar e o que o fichamento registra.
 */

/** Citação literal. Só existe quando o texto consta do material, sempre com fonte. */
export interface CitacaoFicha {
  readonly texto: string;
  /** Quem disse e onde está no material. Ex.: 'Antígona, v. 511 a 520 (MARCONDES; STRUCHINER)'. */
  readonly fonte: string;
}

export interface FichaPensador {
  /** Slug estável, usado na âncora da ficha. Ex.: 'platao'. */
  readonly id: string;
  /** Nome do pensador ou da corrente. Ex.: 'Platão', 'Os sofistas'. */
  readonly nome: string;
  /** Nome curto, para a cápsula do mapa visual. Ausente: usa o nome. */
  readonly nomeCurto?: string;
  /** Datas conforme as aulas. Ausente quando o material não as traz. */
  readonly datas?: string;
  /** Id da fase histórica a que pertence. */
  readonly faseId: string;
  /** Obras de referência citadas no material. Vazio quando o material não cita. */
  readonly obras: readonly string[];
  /** A ideia central: o modo de pensar a justiça, o direito e a lei. */
  readonly modoDePensar: string;
  readonly conceitos: readonly string[];
  readonly citacao?: CitacaoFicha;
  /** Comentário curto: por que isso importa para o Direito hoje. */
  readonly paraODireito: string;
  /** Divergência entre as fontes, atribuída e neutra. Ausente quando não há. */
  readonly ressalva?: string;
  /** Referências bibliográficas das fontes usadas na ficha. */
  readonly referencias: readonly string[];
  /** Id do bloco do resumo que desenvolve o tema. Ex.: 'bloco-4'. */
  readonly blocoResumo: string;
}

export interface FaseHistorica {
  readonly id: string;
  readonly nome: string;
  /** Recorte de tempo, quando o material dá. */
  readonly datas?: string;
}

export interface EraHistorica {
  readonly id: string;
  readonly nome: string;
  readonly datas?: string;
  readonly fases: readonly FaseHistorica[];
}

export interface MapaFichamento {
  /** Raiz do mapa mental. */
  readonly titulo: string;
  readonly eras: readonly EraHistorica[];
  readonly pensadores: readonly FichaPensador[];
}

export type TipoNoMapa =
  | 'raiz'
  | 'era'
  | 'fase'
  | 'pensador'
  | 'modo'
  | 'conceitos'
  | 'conceito'
  | 'direito'
  | 'ressalva'
  | 'ficha';

/** Nó da árvore do mapa mental, derivada de MapaFichamento por construirArvoreMapa. */
export interface NoMapa {
  /** Único na árvore inteira. Vira o id do elemento no DOM. */
  readonly id: string;
  readonly tipo: TipoNoMapa;
  /** Rótulo curto, sempre visível. */
  readonly rotulo: string;
  /** Versão ainda mais curta, para a cápsula do mapa visual. */
  readonly rotuloCurto?: string;
  /** Texto corrido do nó folha ("modo de pensar", "para o Direito hoje"). */
  readonly detalhe?: string;
  /** Presente nos nós de pensador e no atalho 'ficha': id da ficha, para ligar ao fichamento. */
  readonly fichaId?: string;
  readonly filhos: readonly NoMapa[];
}
