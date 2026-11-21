import {
  chmodSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';

/** Prefixo que o mkdtemp usa para as cópias limpas (sufixo de 6 caracteres). */
export const PREFIXO_COPIAS = 'juri-acervo-';

/** Nome inteiro de uma pasta de cópia: prefixo exato + sufixo do mkdtemp, sem separador. */
const NOME_COPIA = new RegExp(`^${PREFIXO_COPIAS}[A-Za-z0-9]{6}$`);
const NOME_PID = '.pid';

export interface ResultadoVarredura {
  apagadas: number;
  falhas: number;
}

export interface OpcoesVarredura {
  uidAtual?: number;
  inicioProcessoMs?: number;
  pidAtual?: number;
  pidVivo?: (pid: number) => boolean;
}

/** Cria a pasta 700 da execução e grava o .pid dela, antes de qualquer imagem entrar. */
export function criarPastaCopias(base: string): string {
  const dir = mkdtempSync(join(base, PREFIXO_COPIAS));
  chmodSync(dir, 0o700);
  try {
    writeFileSync(join(dir, '.pid'), String(process.pid), { flag: 'wx', mode: 0o600 });
  } catch (erro) {
    rmSync(dir, { recursive: true, force: true });
    throw erro;
  }
  return dir;
}

/** Liveness por sinal 0: só ESRCH conta como morto; EPERM (pid de outro usuário) conta como vivo. */
function pidEstaVivo(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (erro) {
    return (erro as { code?: string }).code !== 'ESRCH';
  }
}

type LeituraPid = { tipo: 'ausente' } | { tipo: 'invalido' } | { tipo: 'pid'; pid: number };

/** Lê o .pid sem seguir link simbólico. Ausente, ilegível ou não numérico são tratados à parte. */
function lerPid(dir: string): LeituraPid {
  let st;
  try {
    st = lstatSync(join(dir, NOME_PID));
  } catch (erro) {
    return (erro as { code?: string }).code === 'ENOENT'
      ? { tipo: 'ausente' }
      : { tipo: 'invalido' };
  }
  if (!st.isFile()) {
    return { tipo: 'invalido' };
  }
  const texto = readFileSync(join(dir, NOME_PID), 'utf8').trim();
  if (!/^\d{1,9}$/.test(texto)) {
    return { tipo: 'invalido' };
  }
  const pid = Number(texto);
  return pid > 0 ? { tipo: 'pid', pid } : { tipo: 'invalido' };
}

/**
 * Apaga as sobras de execuções anteriores (kill -9 pula o finally de metadados.ts).
 * Sobra = nome no formato exato, diretório real (não link), do usuário atual, mais antigo que
 * o processo atual, e cujo .pid (se existir) não aponta para processo vivo. Falha fechada:
 * na dúvida, preserva. Nunca sobe de diretório: o nome é validado antes de virar caminho.
 */
export function varrerSobras(base: string, opcoes: OpcoesVarredura = {}): ResultadoVarredura {
  const uid = opcoes.uidAtual ?? process.getuid?.();
  if (uid === undefined) {
    return { apagadas: 0, falhas: 0 };
  }
  const inicio = opcoes.inicioProcessoMs ?? Date.now() - process.uptime() * 1000;
  const pidAtual = opcoes.pidAtual ?? process.pid;
  const pidVivo = opcoes.pidVivo ?? pidEstaVivo;

  let nomes: string[];
  try {
    nomes = readdirSync(base);
  } catch {
    return { apagadas: 0, falhas: 0 };
  }

  let apagadas = 0;
  let falhas = 0;
  for (const nome of nomes) {
    if (!NOME_COPIA.test(nome)) {
      continue;
    }
    const alvo = join(base, nome);
    try {
      const st = lstatSync(alvo);
      if (!st.isDirectory() || st.isSymbolicLink()) {
        continue;
      }
      if (st.uid !== uid || st.mtimeMs >= inicio) {
        continue;
      }
      const pid = lerPid(alvo);
      if (pid.tipo === 'invalido') {
        continue;
      }
      if (pid.tipo === 'pid' && (pid.pid === pidAtual || pidVivo(pid.pid))) {
        continue;
      }
      rmSync(alvo, { recursive: true, force: false });
      apagadas++;
    } catch {
      falhas++;
    }
  }
  return { apagadas, falhas };
}
