import type {
  BlocoDoTexto,
  TextoIntegral,
  TrechoDoTexto
} from '../../../src/core/textoIntegral/tipos';

/** Markdown que o conversor não consegue levar ao texto fiel. A mensagem nomeia a linha. */
export class ErroDeConversao extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroDeConversao';
  }
}

const PAGINA = /\[p\. (\d+)\]/;

/**
 * Converte o markdown do OCR em TextoIntegral. Função pura. Só tira os
 * marcadores (# de título e de subtítulo, * de itálico, o escape \* vira *, e
 * [p. N] vira trecho de página); junta as linhas de um parágrafo com espaço.
 * Nenhum outro caractere muda.
 */
export function converterMarkdown(markdown: string, fonte: string): TextoIntegral {
  const linhas = markdown.split(/\r?\n/);
  const primeira = linhas.findIndex((linha) => linha.trim() !== '');
  const numeroDoTitulo = Math.max(primeira, 0) + 1;
  const cabecalho = primeira >= 0 ? linhas[primeira]!.trim() : '';
  if (!/^# /.test(cabecalho)) {
    throw new ErroDeConversao(`linha ${numeroDoTitulo}: falta o título (# Título) no começo`);
  }
  const titulo = textoDeCabecalho(cabecalho.slice(2), numeroDoTitulo);
  if (titulo === '') throw new ErroDeConversao(`linha ${numeroDoTitulo}: título vazio`);

  const blocos: BlocoDoTexto[] = [];
  let paragrafo: { linhaInicial: number; partes: string[] } | undefined;
  const fechar = (): void => {
    if (!paragrafo) return;
    blocos.push({
      tipo: 'paragrafo',
      trechos: tokenizar(paragrafo.partes.join(' '), paragrafo.linhaInicial)
    });
    paragrafo = undefined;
  };

  for (let i = primeira + 1; i < linhas.length; i++) {
    const numero = i + 1;
    const linha = linhas[i]!.trim();
    if (linha === '') {
      fechar();
    } else if (/^## /.test(linha)) {
      fechar();
      blocos.push({ tipo: 'subtitulo', texto: textoDeCabecalho(linha.slice(3), numero) });
    } else if (linha.startsWith('#')) {
      throw new ErroDeConversao(
        `linha ${numero}: cabeçalho não suportado (só "# " para o título e "## " para subtítulo)`
      );
    } else {
      if (contarAsteriscos(linha) % 2 !== 0) {
        throw new ErroDeConversao(
          `linha ${numero}: asterisco sem par (o itálico abre e fecha na mesma linha)`
        );
      }
      paragrafo ??= { linhaInicial: numero, partes: [] };
      paragrafo.partes.push(linha);
    }
  }
  fechar();

  if (!blocos.some((bloco) => bloco.tipo === 'paragrafo')) {
    throw new ErroDeConversao(`linha ${linhas.length}: o texto não tem nenhum parágrafo`);
  }
  return { titulo, fonte, blocos };
}

/** Texto de título ou subtítulo: sem itálico, só o escape \* vira asterisco. */
function textoDeCabecalho(bruto: string, numero: number): string {
  const texto = bruto.trim();
  if (contarAsteriscos(texto) > 0) {
    throw new ErroDeConversao(`linha ${numero}: itálico não é aceito em título ou subtítulo`);
  }
  return texto.replace(/\\\*/g, '*');
}

/** Asterisco de itálico: o que não é escapado por barra invertida. */
function contarAsteriscos(linha: string): number {
  return (linha.replace(/\\\*/g, '').match(/\*/g) ?? []).length;
}

/**
 * Quebra um parágrafo (linhas já juntas com espaço) em trechos: texto, itálico
 * e marcador de página. Espaço adjacente ao marcador de página é tirado, porque
 * a página é desenhada com espaço próprio pelo visor.
 */
function tokenizar(paragrafoJunto: string, linhaInicial: number): TrechoDoTexto[] {
  const partes = paragrafoJunto.split(new RegExp(PAGINA.source, 'g'));
  const trechos: TrechoDoTexto[] = [];
  partes.forEach((parte, indice) => {
    if (indice % 2 === 1) {
      trechos.push({ tipo: 'pagina', numero: Number(parte) });
      return;
    }
    let segmento = parte;
    if (indice > 0) segmento = segmento.trimStart();
    if (indice < partes.length - 1) segmento = segmento.trimEnd();
    trechos.push(...trechosDoSegmento(segmento, linhaInicial));
  });
  return trechos;
}

function trechosDoSegmento(segmento: string, linhaInicial: number): TrechoDoTexto[] {
  const trechos: TrechoDoTexto[] = [];
  let acumulado = '';
  let italico = false;
  for (let k = 0; k < segmento.length; k++) {
    const caractere = segmento[k]!;
    if (caractere === '\\' && segmento[k + 1] === '*') {
      acumulado += '*';
      k++;
    } else if (caractere === '*') {
      if (acumulado !== '') trechos.push(trecho(acumulado, italico));
      acumulado = '';
      italico = !italico;
    } else {
      acumulado += caractere;
    }
  }
  if (italico) {
    throw new ErroDeConversao(`linha ${linhaInicial}: itálico aberto e não fechado`);
  }
  if (acumulado !== '') trechos.push(trecho(acumulado, false));
  return trechos;
}

function trecho(texto: string, italico: boolean): TrechoDoTexto {
  return italico ? { tipo: 'italico', texto } : { tipo: 'texto', texto };
}

/** Conteúdo do arquivo gravado: `export const textoIntegral` tipado, sem editar à mão. */
export function formatarArquivoTextoIntegral(texto: TextoIntegral): string {
  return [
    "import type { TextoIntegral } from '../../../tipos';",
    '/** Transcrição fiel (OCR), gerada por npm run texto-integral; não editar o texto à mão. */',
    `export const textoIntegral: TextoIntegral = ${JSON.stringify(texto, null, 2)};`,
    ''
  ].join('\n');
}
