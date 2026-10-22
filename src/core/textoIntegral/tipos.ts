/**
 * Texto integral de uma unidade (transcrição fiel de OCR de um trecho do
 * livro). O OCR é texto fiel por decisão do líder (21/10/2026), e por isso o
 * corpo é dado estruturado, sem HTML: o visor escreve cada trecho como texto
 * (sem v-html) e nenhum caractere do original é reescrito.
 */

/** Pedaço de um parágrafo: texto corrido, trecho em itálico ou marcador de página. */
export type TrechoDoTexto =
  | { readonly tipo: 'texto'; readonly texto: string }
  | { readonly tipo: 'italico'; readonly texto: string }
  | { readonly tipo: 'pagina'; readonly numero: number };

/** Bloco do texto: subtítulo de seção ou parágrafo feito de trechos. */
export type BlocoDoTexto =
  | { readonly tipo: 'subtitulo'; readonly texto: string }
  | { readonly tipo: 'paragrafo'; readonly trechos: readonly TrechoDoTexto[] };

export interface TextoIntegral {
  readonly titulo: string;
  /** Referência bibliográfica do trecho, exibida junto do título. */
  readonly fonte: string;
  readonly blocos: readonly BlocoDoTexto[];
}
