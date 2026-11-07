import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { idAleatorio, sha256Hex } from './codigos';
import { serializarConferencia, type LinhaConferencia } from './conferenciaTsv';
import { gravarPrivado, limparCriados, verificarOriginais, verificarSaida } from './arquivos';
import { ErroFerramenta } from './erro';
import type { EntradaIndice } from './indice';
import { anexarIds, lerIdsArquivo, NOME_IDS, resolverIds } from './idsTsv';
import { limparEVerificar } from './metadados';
import { listarOriginais } from './originais';

export interface OpcoesPreparar {
  originais: string;
  saida: string;
}

export interface ResultadoPreparar {
  imagens: number;
  avisos: string[];
}

function porId<T extends { id: string }>(a: T, b: T): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Gera a saída do acervo em claro: cada imagem sai sem metadado (exiftool -all=, conferido
 * na cópia), gravada como imagens/<id> em 600, e acervo.json com id, tipo, bytes e sha256.
 * Os ids vêm do ids.tsv da pasta de originais. Falha no meio desfaz só o que criou.
 */
export async function preparar(opcoes: OpcoesPreparar): Promise<ResultadoPreparar> {
  const originais = resolve(opcoes.originais);
  const saida = resolve(opcoes.saida);
  verificarOriginais(originais);
  const imagens = listarOriginais(originais);
  const caminhoIds = join(originais, NOME_IDS);
  const { idPorSha, novas } = resolverIds(imagens, lerIdsArquivo(caminhoIds), idAleatorio);
  verificarSaida(saida, originais);

  const criados: string[] = [];
  try {
    if (!existsSync(saida)) {
      mkdirSync(saida, { mode: 0o700 });
      criados.push(saida);
    }
    chmodSync(saida, 0o700);
    const pastaImagens = join(saida, 'imagens');
    mkdirSync(pastaImagens, { mode: 0o700 });
    criados.push(pastaImagens);

    const { limpas, avisos } = await limparEVerificar(imagens);

    const indice: EntradaIndice[] = [];
    const conferencia: LinhaConferencia[] = [];
    for (const [i, original] of imagens.entries()) {
      const limpa = limpas[i];
      const id = idPorSha.get(original.sha256);
      if (limpa === undefined || id === undefined) {
        throw new ErroFerramenta(`imagem ${i + 1}: sem cópia limpa ou sem id (falha interna)`);
      }
      const sha256 = sha256Hex(limpa);
      gravarPrivado(join(pastaImagens, id), limpa, criados);
      indice.push({ id, tipo: original.tipo, bytes: limpa.byteLength, sha256 });
      conferencia.push({ id, sha256, bytes: limpa.byteLength });
    }
    indice.sort(porId);
    conferencia.sort(porId);

    gravarPrivado(join(saida, 'acervo.json'), JSON.stringify({ indice }), criados);
    gravarPrivado(join(saida, 'conferencia.tsv'), serializarConferencia(conferencia), criados);
    anexarIds(caminhoIds, novas);
    return { imagens: imagens.length, avisos };
  } catch (erro) {
    limparCriados(criados);
    throw erro;
  }
}
