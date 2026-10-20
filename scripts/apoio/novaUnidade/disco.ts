import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { format, resolveConfig } from 'prettier';

/**
 * Leitura e escrita no disco para o gerador. O que vai ao disco passa pelo
 * Prettier com a configuração deste repositório (a mesma do preci), para que
 * o arquivo gerado já nasça no estilo do projeto.
 */

export interface ArquivoAGravar {
  /** Caminho absoluto. */
  readonly caminho: string;
  readonly conteudo: string;
}

export interface DescricaoLida {
  readonly nome?: string;
  readonly ordem?: number;
}

export function existe(caminho: string): boolean {
  return existsSync(caminho);
}

/** Nome das pastas diretas de uma pasta (vazio se a pasta não existir). */
export function listarPastas(pasta: string): string[] {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta)
    .filter((nome) => !nome.startsWith('.') && statSync(join(pasta, nome)).isDirectory())
    .sort();
}

/** Lê nome e ordem de um cadeira.ts importando-o, como o build faz. */
export async function lerCadeira(caminho: string): Promise<DescricaoLida> {
  const modulo = (await import(pathToFileURL(caminho).href)) as {
    cadeira?: { nome?: unknown; ordem?: unknown };
  };
  const cadeira = modulo.cadeira ?? {};
  return {
    ...(typeof cadeira.nome === 'string' ? { nome: cadeira.nome } : {}),
    ...(typeof cadeira.ordem === 'number' ? { ordem: cadeira.ordem } : {})
  };
}

/**
 * Próxima ordem livre no período: uma acima da maior já usada, ou 1 quando o
 * período ainda não tem cadeira. Pode haver buraco na sequência, e não importa.
 */
export async function proximaOrdemLivre(pastaDoPeriodo: string): Promise<number> {
  const ordens: number[] = [];
  for (const cadeira of listarPastas(pastaDoPeriodo)) {
    const arquivo = join(pastaDoPeriodo, cadeira, 'cadeira.ts');
    if (!existsSync(arquivo)) continue;
    const { ordem } = await lerCadeira(arquivo);
    if (ordem !== undefined) ordens.push(ordem);
  }
  return ordens.length === 0 ? 1 : Math.max(...ordens) + 1;
}

/**
 * Grava os arquivos com flag 'wx': se alguma coisa aparecer entre o plano e
 * a escrita, o arquivo existente não é tocado (nada de sobrescrever).
 */
export async function gravarArquivos(arquivos: readonly ArquivoAGravar[]): Promise<void> {
  const configuracao = await resolveConfig(fileURLToPath(import.meta.url));
  for (const arquivo of arquivos) {
    const texto = await format(arquivo.conteudo, { ...configuracao, parser: 'typescript' });
    mkdirSync(dirname(arquivo.caminho), { recursive: true });
    writeFileSync(arquivo.caminho, texto, { flag: 'wx' });
  }
}
