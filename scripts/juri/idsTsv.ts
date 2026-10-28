import { appendFileSync, chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { ErroFerramenta } from './erro';
import type { Original } from './originais';

/*
 * ids.tsv: mapeia cada imagem original (pelo SHA-256 do conteúdo) ao id estável do acervo.
 * Mora DENTRO da pasta de originais (fora do staging, que é apagado depois da instalação),
 * porque sem ele o "esqueci a senha" renumera o acervo e quebra o juri.json.
 */

export const NOME_IDS = 'ids.tsv';
const CABECALHO = 'id\tsha256\tnome';
const RE_ID = /^[0-9a-f]{32}$/;
const RE_SHA = /^[0-9a-f]{64}$/;

export interface LinhaId {
  id: string;
  sha256: string;
  nome: string;
}

export interface ResolucaoIds {
  /** SHA-256 do conteúdo -> id do acervo, para cada original desta rodada. */
  idPorSha: Map<string, string>;
  /** Linhas que esta rodada acrescenta ao ids.tsv (as demais já existiam). */
  novas: LinhaId[];
}

/** Lê o ids.tsv inteiro e recusa qualquer linha fora do formato (arquivo corrompido ou truncado). */
export function lerIds(texto: string): LinhaId[] {
  if (texto === '') {
    return [];
  }
  if (!texto.endsWith('\n')) {
    throw new ErroFerramenta('ids.tsv: última linha sem quebra de linha (arquivo truncado)');
  }
  const linhas = texto.slice(0, -1).split('\n');
  if (linhas[0] !== CABECALHO) {
    throw new ErroFerramenta('ids.tsv: cabeçalho fora do formato (id, sha256, nome)');
  }
  const vistos = new Set<string>();
  return linhas.slice(1).map((linha, i) => {
    const numero = i + 2;
    const campos = linha.split('\t');
    if (campos.length !== 3) {
      throw new ErroFerramenta(`ids.tsv: linha ${numero} não tem 3 colunas`);
    }
    const [id = '', sha256 = '', nome = ''] = campos;
    if (!RE_ID.test(id)) {
      throw new ErroFerramenta(`ids.tsv: linha ${numero} com id fora do formato`);
    }
    if (!RE_SHA.test(sha256)) {
      throw new ErroFerramenta(`ids.tsv: linha ${numero} com sha256 fora do formato`);
    }
    if (nome === '') {
      throw new ErroFerramenta(`ids.tsv: linha ${numero} sem nome`);
    }
    if (vistos.has(id)) {
      throw new ErroFerramenta(`ids.tsv: linha ${numero} repete um id já usado`);
    }
    vistos.add(id);
    return { id, sha256, nome };
  });
}

/**
 * Regras da segunda rodada (e de qualquer rodada): nome igual com conteúdo diferente recusa
 * (servir foto diferente sob id antigo); linha sem imagem correspondente recusa (imagem sumiu);
 * conteúdo igual reusa o id, mesmo renomeado; imagem nova ganha id que nunca foi usado.
 */
export function resolverIds(
  originais: readonly Original[],
  existentes: readonly LinhaId[],
  gerarId: () => string
): ResolucaoIds {
  const shas = new Set<string>();
  for (const original of originais) {
    if (shas.has(original.sha256)) {
      throw new ErroFerramenta('duas imagens em originais têm o mesmo conteúdo (use uma só)');
    }
    shas.add(original.sha256);
  }
  for (const original of originais) {
    const porNome = existentes.find((linha) => linha.nome === original.nome);
    if (porNome !== undefined && porNome.sha256 !== original.sha256) {
      const numero = existentes.indexOf(porNome) + 2;
      throw new ErroFerramenta(
        `ids.tsv: imagem de mesmo nome mudou de conteúdo (linha ${numero}); recusado para não servir foto diferente sob id antigo`
      );
    }
  }
  existentes.forEach((linha, i) => {
    if (!shas.has(linha.sha256)) {
      throw new ErroFerramenta(
        `ids.tsv: linha ${i + 2} sem imagem correspondente em originais (arquivo sumiu ou mudou de conteúdo)`
      );
    }
  });

  const idsUsados = new Set(existentes.map((linha) => linha.id));
  const idPorSha = new Map<string, string>();
  const novas: LinhaId[] = [];
  for (const original of originais) {
    const porConteudo = existentes.find((linha) => linha.sha256 === original.sha256);
    if (porConteudo !== undefined) {
      idPorSha.set(original.sha256, porConteudo.id);
      continue;
    }
    let id = gerarId();
    while (idsUsados.has(id)) {
      id = gerarId();
    }
    idsUsados.add(id);
    idPorSha.set(original.sha256, id);
    novas.push({ id, sha256: original.sha256, nome: original.nome });
  }
  return { idPorSha, novas };
}

/** Linhas novas em formato tsv, sem cabeçalho. Nome com tab ou quebra de linha não cabe no formato. */
export function serializarNovas(novas: readonly LinhaId[]): string {
  return novas
    .map((linha) => {
      if (/[\t\r\n]/.test(linha.nome)) {
        throw new ErroFerramenta(
          'nome de original com tabulação ou quebra de linha não cabe no ids.tsv'
        );
      }
      return `${linha.id}\t${linha.sha256}\t${linha.nome}\n`;
    })
    .join('');
}

export function lerIdsArquivo(caminho: string): LinhaId[] {
  if (!existsSync(caminho)) {
    return [];
  }
  return lerIds(readFileSync(caminho, 'utf8'));
}

/** Acrescenta só as linhas novas (append-only: id usado nunca some). Cria o arquivo com 600 se não existe. */
export function anexarIds(caminho: string, novas: readonly LinhaId[]): void {
  if (novas.length === 0) {
    return;
  }
  const linhas = serializarNovas(novas);
  if (existsSync(caminho)) {
    appendFileSync(caminho, linhas);
    chmodSync(caminho, 0o600);
    return;
  }
  writeFileSync(caminho, `${CABECALHO}\n${linhas}`, { flag: 'wx', mode: 0o600 });
}
