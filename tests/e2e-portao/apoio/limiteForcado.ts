import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { PRIVADO } from './ambiente';

/** Endereços de loopback que o servidor pode enxergar para o navegador do teste (IPv4 e IPv6). */
export const IPS_DO_NAVEGADOR = ['127.0.0.1', '::1'] as const;

export type ModoDeLimite = 'conta' | 'ip' | 'bloqueada';

/**
 * Força o estado de limite ou de bloqueio no privado sintético do teste (apoio/limiteForcado.php). Só o modo e o
 * login cruzam a linha de comando; o privado é sempre o do harness, nunca um caminho recebido de fora.
 */
export function forcarLimite(modo: ModoDeLimite, login: string): void {
  execFileSync(
    'php',
    [join(import.meta.dirname, 'limiteForcado.php'), PRIVADO, modo, login, ...IPS_DO_NAVEGADOR],
    { stdio: 'pipe' }
  );
}
