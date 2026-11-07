import { spawn } from 'node:child_process';
import { indicesEncontrados, normalizarParaBusca } from '../../src/core/restrito/termosVazamento';

/**
 * Só os diffs (formato vazio). `--no-textconv`: o que está cifrado no remoto é
 * cifra, não se decifra o histórico para varrer (E2, plano do CTO, F1.2). Sem o
 * textconv, o git não roda o filtro do git-crypt nem escreve no stderr.
 */
export const ARGS_HISTORICO = ['log', '--all', '-p', '--no-textconv', '--format='] as const;

const TIMEOUT_PADRAO_MS = 120_000;

export interface VarreduraHistorico {
  /** Bytes de stdout lidos do histórico. */
  readonly bytes: number;
  /** Posições, em `termos`, dos termos achados. Nunca devolve o termo. */
  readonly encontrados: ReadonlySet<number>;
}

export interface OpcoesHistorico {
  readonly cwd: string;
  readonly comando?: string;
  readonly args?: readonly string[];
  readonly timeoutMs?: number;
}

export function varrerHistorico(
  termos: readonly string[],
  opcoes: OpcoesHistorico
): Promise<VarreduraHistorico> {
  return new Promise((resolver, rejeitar) => {
    const achados = new Set<number>();
    const maior = Math.max(...termos.map((t) => t.length));
    const comando = opcoes.comando ?? 'git';
    const args = opcoes.args ?? ARGS_HISTORICO;
    // stderr ignorado de propósito: pipe sem leitor enche e trava o processo (E2, F0.4).
    const git = spawn(comando, [...args], {
      cwd: opcoes.cwd,
      detached: true,
      stdio: ['ignore', 'pipe', 'ignore']
    });
    git.stdout.setEncoding('utf-8');
    let cauda = '';
    let bytes = 0;
    git.stdout.on('data', (pedaco: string) => {
      bytes += Buffer.byteLength(pedaco);
      const alvo = normalizarParaBusca(cauda + pedaco.replace(/\n[+ -]/g, '\n'));
      for (const i of indicesEncontrados(alvo, termos)) achados.add(i);
      cauda = alvo.slice(-maior);
    });
    const prazo = setTimeout(() => {
      try {
        process.kill(-git.pid!, 'SIGKILL');
      } catch {
        // o grupo pode já ter saído
      }
      rejeitar(
        new Error(`histórico: tempo esgotado em ${opcoes.timeoutMs ?? TIMEOUT_PADRAO_MS} ms`)
      );
    }, opcoes.timeoutMs ?? TIMEOUT_PADRAO_MS);
    git.on('error', (erro) => {
      clearTimeout(prazo);
      rejeitar(erro);
    });
    git.on('close', (codigo) => {
      clearTimeout(prazo);
      if (codigo !== 0) rejeitar(new Error(`histórico saiu com ${codigo}`));
      else resolver({ bytes, encontrados: achados });
    });
  });
}
