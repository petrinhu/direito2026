import { ehIdImagem } from '../../src/core/juri/idImagem';
import { ErroFerramenta } from './erro';

/*
 * conferencia.tsv fica na SAÍDA (local, nunca sobe ao servidor): id, SHA-256 do texto
 * limpo (sem metadado) e tamanho do .juri. Com ele o conferir prova a ida e volta sem
 * guardar plaintext em staging e sem precisar dos originais.
 */

const CABECALHO = 'id\tsha256\tbytes';
const RE_SHA = /^[0-9a-f]{64}$/;

export interface LinhaConferencia {
  id: string;
  sha256: string;
  bytes: number;
}

export function serializarConferencia(linhas: readonly LinhaConferencia[]): string {
  const corpo = linhas.map((linha) => `${linha.id}\t${linha.sha256}\t${linha.bytes}`);
  return [CABECALHO, ...corpo].join('\n') + '\n';
}

export function lerConferencia(texto: string): Map<string, LinhaConferencia> {
  const linhas = texto.split('\n');
  if (linhas.pop() !== '') {
    throw new ErroFerramenta(
      'conferencia.tsv: última linha sem quebra de linha (arquivo truncado)'
    );
  }
  if (linhas[0] !== CABECALHO) {
    throw new ErroFerramenta('conferencia.tsv: cabeçalho fora do formato');
  }
  const mapa = new Map<string, LinhaConferencia>();
  for (const [i, linha] of linhas.slice(1).entries()) {
    const campos = linha.split('\t');
    const [id = '', sha256 = '', bytesTexto = ''] = campos;
    if (
      campos.length !== 3 ||
      !ehIdImagem(id) ||
      !RE_SHA.test(sha256) ||
      !/^\d+$/.test(bytesTexto)
    ) {
      throw new ErroFerramenta(`conferencia.tsv: linha ${i + 2} fora do formato`);
    }
    if (mapa.has(id)) {
      throw new ErroFerramenta(`conferencia.tsv: linha ${i + 2} repete um id`);
    }
    mapa.set(id, { id, sha256, bytes: Number(bytesTexto) });
  }
  return mapa;
}
