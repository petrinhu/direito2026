import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { sha256Hex } from './codigos';
import { lerConferencia, type LinhaConferencia } from './conferenciaTsv';
import { ErroFerramenta } from './erro';
import { validarIndice, type Indice } from './indice';
import { verificarEntradas, type EntradaImagem } from './metadados';
import { detectarTipo } from './originais';

export interface OpcoesConferir {
  saida: string;
}

export interface ResultadoConferir {
  imagens: number;
}

function lerJson(caminho: string, nome: string): unknown {
  try {
    return JSON.parse(readFileSync(caminho, 'utf8'));
  } catch {
    throw new ErroFerramenta(`${nome}: ausente ou não é JSON válido`);
  }
}

/** conferencia.tsv cobre exatamente o índice, com o mesmo sha256 e o mesmo tamanho. */
function conferirConjunto(indice: Indice, conferencia: Map<string, LinhaConferencia>): void {
  const entradas = indice.indice;
  const bate = entradas.every((entrada) => {
    const linha = conferencia.get(entrada.id);
    return linha !== undefined && linha.sha256 === entrada.sha256 && linha.bytes === entrada.bytes;
  });
  if (conferencia.size !== entradas.length || !bate) {
    throw new ErroFerramenta('conferencia.tsv não cobre exatamente o índice do acervo');
  }
}

/** A pasta imagens/ tem exatamente os arquivos do índice: nem sobra, nem falta. */
function conferirDiretorio(saida: string, indice: Indice): void {
  const esperados = indice.indice.map((entrada) => entrada.id).sort();
  const listados = readdirSync(join(saida, 'imagens')).sort();
  if (esperados.length !== listados.length || esperados.some((nome, i) => nome !== listados[i])) {
    throw new ErroFerramenta(
      `imagens/ tem ${listados.length} arquivo(s) e o índice pede ${esperados.length}: sobra ou falta arquivo`
    );
  }
}

/** Cada arquivo bate com o índice em tamanho, sha256 e tipo do conteúdo (nunca pela extensão). */
function lerImagensDoIndice(saida: string, indice: Indice): EntradaImagem[] {
  return indice.indice.map((entrada, i) => {
    const numero = i + 1;
    const bytes = new Uint8Array(readFileSync(join(saida, 'imagens', entrada.id)));
    if (bytes.byteLength !== entrada.bytes) {
      throw new ErroFerramenta(`imagem ${numero}: tamanho do arquivo diferente do índice`);
    }
    if (sha256Hex(bytes) !== entrada.sha256) {
      throw new ErroFerramenta(`imagem ${numero} não confere com o índice (sha256)`);
    }
    if (detectarTipo(bytes) !== entrada.tipo) {
      throw new ErroFerramenta(`imagem ${numero}: tipo do conteúdo diferente do índice`);
    }
    return { bytes, tipo: entrada.tipo };
  });
}

/**
 * Prova do acervo em claro: índice no contrato, conferencia.tsv no mesmo conjunto, pasta sem
 * sobra nem falta, cada arquivo com o sha256 do índice e, por fim, zero etiqueta fora da lista
 * (exiftool, na cópia). Qualquer falha reprova; não há "limpar e seguir".
 */
export async function conferir(opcoes: OpcoesConferir): Promise<ResultadoConferir> {
  const saida = resolve(opcoes.saida);
  const indice = validarIndice(lerJson(join(saida, 'acervo.json'), 'acervo.json'));
  const conferencia = lerConferencia(readFileSync(join(saida, 'conferencia.tsv'), 'utf8'));
  conferirConjunto(indice, conferencia);
  conferirDiretorio(saida, indice);
  const entradas = lerImagensDoIndice(saida, indice);
  await verificarEntradas(entradas);
  return { imagens: indice.indice.length };
}
