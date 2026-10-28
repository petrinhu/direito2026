import {
  chmodSync,
  existsSync,
  readdirSync,
  realpathSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { ErroFerramenta } from './erro';

/** Verdadeiro se o caminho (ou o ancestral mais próximo que já existe) está dentro de um repositório git. */
export function dentroDeRepositorio(caminho: string): boolean {
  let atual = resolve(caminho);
  while (!existsSync(atual)) {
    const pai = dirname(atual);
    if (pai === atual) {
      break;
    }
    atual = pai;
  }
  atual = realpathSync(atual);
  for (;;) {
    if (existsSync(join(atual, '.git'))) {
      return true;
    }
    const pai = dirname(atual);
    if (pai === atual) {
      return false;
    }
    atual = pai;
  }
}

/** Originais: pasta existente e fora de repositório (L-28: dado de pessoa não entra no repositório). */
export function verificarOriginais(pasta: string): void {
  if (!existsSync(pasta) || !statSync(pasta).isDirectory()) {
    throw new ErroFerramenta('originais: a pasta não existe ou não é um diretório');
  }
  if (dentroDeRepositorio(pasta)) {
    throw new ErroFerramenta(
      'originais está dentro de um repositório git (dado de pessoa não entra no repositório)'
    );
  }
}

/**
 * Saída: fora de repositório, sem sobrepor os originais, e VAZIA se já existe (nunca mistura
 * acervo de chave diferente). O pai precisa existir: a ferramenta não cria árvore inteira.
 */
export function verificarSaida(saida: string, originais: string): void {
  if (dentroDeRepositorio(saida)) {
    throw new ErroFerramenta('saída está dentro de um repositório git');
  }
  if (
    saida === originais ||
    saida.startsWith(originais + sep) ||
    originais.startsWith(saida + sep)
  ) {
    throw new ErroFerramenta('saída e originais se sobrepõem');
  }
  if (existsSync(saida)) {
    if (!statSync(saida).isDirectory() || readdirSync(saida).length > 0) {
      throw new ErroFerramenta(
        'saída não está vazia: use uma pasta nova, para não misturar acervo de chave diferente'
      );
    }
    return;
  }
  if (!existsSync(dirname(saida))) {
    throw new ErroFerramenta('saída: o diretório pai não existe');
  }
}

/** Grava um arquivo novo com 600. Nunca sobrescreve (flag wx) e registra o caminho para a limpeza. */
export function gravarPrivado(
  caminho: string,
  conteudo: string | Uint8Array,
  criados: string[]
): void {
  writeFileSync(caminho, conteudo, { flag: 'wx', mode: 0o600 });
  chmodSync(caminho, 0o600);
  criados.push(caminho);
}

/**
 * Desfaz só o que esta rodada criou, pelo caminho exato registrado (L-53), na ordem inversa.
 * Pasta só sai se estiver vazia: nunca apaga o que não é nosso.
 */
export function limparCriados(criados: readonly string[]): void {
  for (const caminho of [...criados].reverse()) {
    if (!existsSync(caminho)) {
      continue;
    }
    if (statSync(caminho).isDirectory()) {
      rmdirSync(caminho);
    } else {
      unlinkSync(caminho);
    }
  }
}
