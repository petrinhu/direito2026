import { execFile } from 'node:child_process';
import { ErroFerramenta } from './erro';

export interface SaidaExiftool {
  stdout: string;
  stderr: string;
}

/**
 * Roda o exiftool com argumentos em array (sem shell). Uma chamada por LOTE: quem chama
 * confere a contagem de arquivos que o exiftool reporta, nunca presume que o lote inteiro passou.
 */
export function rodarExiftool(args: readonly string[]): Promise<SaidaExiftool> {
  return new Promise((resolver, rejeitar) => {
    execFile(
      'exiftool',
      [...args],
      { encoding: 'utf8', timeout: 120_000, maxBuffer: 64 * 1024 * 1024 },
      (erro, stdout, stderr) => {
        if (erro === null) {
          resolver({ stdout: String(stdout), stderr: String(stderr) });
          return;
        }
        if (erro.code === 'ENOENT') {
          rejeitar(new ErroFerramenta('exiftool não encontrado no PATH'));
          return;
        }
        rejeitar(
          new ErroFerramenta(`exiftool falhou (código ${String(erro.code ?? 'desconhecido')})`)
        );
      }
    );
  });
}
