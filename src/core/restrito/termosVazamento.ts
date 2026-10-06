/**
 * Termos que NUNCA podem aparecer fora da área restrita: integrantes,
 * instituição e trechos distintivos do resumo e do quiz. Núcleo puro do
 * portão scripts/verificar-conteudo-restrito.ts (a leitura de disco, do git
 * e do dist fica no script). O nome do grupo é público e fica de fora.
 */

export interface TermosDeVazamento {
  readonly integrantes: readonly string[];
  readonly instituicao: readonly string[];
  readonly trechos: readonly string[];
}

const TAMANHO_MINIMO_TRECHO = 40;
const TAMANHO_JANELA = 60;
const ENTIDADES: ReadonlyArray<readonly [string, string]> = [
  ['&nbsp;', ' '],
  ['&quot;', '"'],
  ['&#39;', "'"],
  ['&lt;', '<'],
  ['&gt;', '>'],
  ['&amp;', '&']
];

/** Caixa baixa, sem diacrítico, espaço colapsado: os dois lados da busca passam por aqui. */
export function normalizarParaBusca(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function decodificar(texto: string): string {
  return ENTIDADES.reduce((acc, [de, para]) => acc.split(de).join(para), texto);
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function listaDe(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : [];
}

function textosDe(valor: unknown): string[] {
  return typeof valor === 'string' ? [valor] : [];
}

function trechosDe(html: string): string[] {
  return html
    .split(/<[^>]*>/)
    .map((pedaco) => normalizarParaBusca(decodificar(pedaco)))
    .filter((pedaco) => pedaco.length >= TAMANHO_MINIMO_TRECHO)
    .flatMap((pedaco) => {
      const inicio = pedaco.slice(0, TAMANHO_JANELA).trim();
      const fim = pedaco.slice(-TAMANHO_JANELA).trim();
      return pedaco.length > 2 * TAMANHO_JANELA ? [inicio, fim] : [inicio];
    });
}

/**
 * Lê o JSON restrito de forma tolerante (campo faltando vira lista vazia):
 * quem decide se o JSON é válido é o validador, não este extrator.
 */
export function extrairTermosDeVazamento(json: unknown): TermosDeVazamento {
  const raiz = ehObjeto(json) ? json : {};
  const equipe = ehObjeto(raiz.equipe) ? raiz.equipe : {};
  const normalizados = (itens: string[]): string[] => [
    ...new Set(itens.map(normalizarParaBusca).filter((t) => t.length > 0))
  ];

  const camposHtml: string[] = [];
  for (const bloco of listaDe(raiz.resumo)) {
    if (!ehObjeto(bloco)) continue;
    camposHtml.push(...textosDe(bloco.corpoHtml), ...textosDe(bloco.exemploHtml));
    camposHtml.push(...listaDe(bloco.resumo).flatMap(textosDe));
  }
  for (const pergunta of listaDe(raiz.quiz)) {
    if (!ehObjeto(pergunta)) continue;
    camposHtml.push(...textosDe(pergunta.enunciadoHtml), ...textosDe(pergunta.explicacaoHtml));
    camposHtml.push(...listaDe(pergunta.alternativasHtml).flatMap(textosDe));
  }

  for (const slide of listaDe(raiz.slides)) {
    if (!ehObjeto(slide)) continue;
    camposHtml.push(
      ...textosDe(slide.titulo),
      ...textosDe(slide.subtitulo),
      ...textosDe(slide.destaque),
      ...textosDe(slide.notas),
      ...listaDe(slide.itens).flatMap(textosDe)
    );
    for (const coluna of listaDe(slide.colunas)) {
      if (ehObjeto(coluna))
        camposHtml.push(...textosDe(coluna.titulo), ...listaDe(coluna.itens).flatMap(textosDe));
    }
  }

  return {
    integrantes: normalizados(listaDe(equipe.integrantes).flatMap(textosDe)),
    instituicao: normalizados(textosDe(equipe.instituicao)),
    trechos: [...new Set(camposHtml.flatMap(trechosDe))]
  };
}

/** Posições, em `termos`, dos termos presentes em `alvoNormalizado`. Nunca devolve o termo. */
export function indicesEncontrados(alvoNormalizado: string, termos: readonly string[]): number[] {
  const achados: number[] = [];
  termos.forEach((termo, i) => {
    if (alvoNormalizado.includes(termo)) achados.push(i);
  });
  return achados;
}

/** Quantos termos distintos aparecem em `alvoNormalizado`. */
export function contarTermosEncontrados(
  alvoNormalizado: string,
  termos: readonly string[]
): number {
  return indicesEncontrados(alvoNormalizado, termos).length;
}
