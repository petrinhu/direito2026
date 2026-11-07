/**
 * Apoio dos testes da ferramenta do acervo da Júri: roda a CLI de verdade (node + tsx),
 * cria diretórios temporários SÓ sob /var/tmp com prefixo próprio e apaga só o que
 * este apoio criou, por caminho exato (L-53). Nenhum dado real passa por aqui.
 */
import { execFile } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ_REPO = fileURLToPath(new URL('../../..', import.meta.url));
const CLI = join(RAIZ_REPO, 'scripts/juri/acervo.ts');
const PREFIXO_TESTE = 'juri-acervo-teste-';
const criados: string[] = [];

export interface ResultadoCli {
  codigo: number;
  stdout: string;
  stderr: string;
}

/** Roda `node --import tsx scripts/juri/acervo.ts <args>` e devolve código, stdout e stderr. */
export function rodarFerramenta(args: readonly string[]): Promise<ResultadoCli> {
  return new Promise((resolver) => {
    execFile(
      process.execPath,
      ['--import', 'tsx', CLI, ...args],
      { cwd: RAIZ_REPO, encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024 },
      (erro, stdout, stderr) => {
        const codigo = erro === null ? 0 : typeof erro.code === 'number' ? erro.code : 1;
        resolver({ codigo, stdout: String(stdout), stderr: String(stderr) });
      }
    );
  });
}

/** Diretório temporário de teste em /var/tmp (TMPDIR), 700, registrado para limpeza. */
export function criarDirTeste(): string {
  const base = process.env.TMPDIR ?? '/var/tmp';
  const dir = mkdtempSync(join(base, PREFIXO_TESTE));
  chmodSync(dir, 0o700);
  criados.push(dir);
  return dir;
}

/** Apaga só os diretórios que este apoio criou, conferindo o prefixo antes de cada remoção. */
export function limparDirsTeste(): void {
  for (const dir of criados.splice(0)) {
    if (!dir.includes(PREFIXO_TESTE)) {
      throw new Error(`recusa apagar fora do prefixo de teste: ${dir}`);
    }
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Grava arquivos (nome -> bytes) numa pasta, com 600. */
export function escreverArquivos(
  pasta: string,
  arquivos: Readonly<Record<string, Uint8Array>>
): void {
  for (const [nome, bytes] of Object.entries(arquivos)) {
    writeFileSync(join(pasta, nome), bytes, { mode: 0o600 });
  }
}

export function lerJson(caminho: string): Record<string, any> {
  return JSON.parse(readFileSync(caminho, 'utf8')) as Record<string, any>;
}
