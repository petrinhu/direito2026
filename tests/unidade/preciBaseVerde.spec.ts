import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * PRECI-BASE-VERDE: a base do pré-CI seletivo é o SHA do último pré-CI verde, guardado FORA do git
 * (scripts/apoio/preciBaseVerde.sh). Sem base válida, a rodada sai completa. Estes testes usam um
 * estado temporário (CADERNO_PRECI_ESTADO) e nunca tocam o estado real do usuário.
 *
 * Os testes de preci.sh rodam o script de verdade num repositório temporário. Só node, npm e npx são
 * falsos (no PATH), e os passos que chamam bash são arquivos vazios: o que se mede é a base passada
 * ao planejador e a gravação do SHA.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const HELPER = join(RAIZ, 'scripts/apoio/preciBaseVerde.sh');
const PRECI = join(RAIZ, 'scripts/preci.sh');

let tmp: string;
let repo: string;
let estado: string;
let binDir: string;
let logBase: string;

function git(args: string[], cwd = repo): string {
  const r = spawnSync(
    'git',
    [
      '-C',
      cwd,
      '-c',
      'user.name=teste',
      '-c',
      'user.email=teste',
      '-c',
      'commit.gpgSign=false',
      ...args
    ],
    { encoding: 'utf-8' }
  );
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

function commit(arquivo: string, conteudo: string, msg: string): string {
  writeFileSync(join(repo, arquivo), conteudo);
  git(['add', '-A']);
  git(['commit', '-q', '-m', msg]);
  return git(['rev-parse', 'HEAD']);
}

/** Ambiente do filho: sem PRECI_BASE_VERDE herdada (a não ser que o teste a passe). */
type Ambiente = Record<string, string | undefined>;

function ambiente(extra: Record<string, string> = {}): Ambiente {
  const env: Ambiente = {
    ...process.env,
    CADERNO_PRECI_ESTADO: estado,
    LOG_BASE: logBase,
    PATH: `${binDir}:${process.env.PATH}`
  };
  delete env.PRECI_BASE_VERDE;
  delete env.CADERNO_CAIXA;
  delete env.FALHA_NODE;
  return { ...env, ...extra };
}

function helper(args: string[], extra: Record<string, string> = {}) {
  return spawnSync('bash', [HELPER, ...args], {
    cwd: repo,
    env: ambiente(extra),
    encoding: 'utf-8'
  });
}

function preci(extra: Record<string, string> = {}) {
  return spawnSync('bash', ['scripts/preci.sh'], {
    cwd: repo,
    env: ambiente(extra),
    encoding: 'utf-8'
  });
}

function base(): string {
  return readFileSync(logBase, 'utf-8').trimEnd();
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'preci-base-verde-'));
  repo = join(tmp, 'repo');
  estado = join(tmp, 'estado', 'ultimo-verde');
  binDir = join(tmp, 'bin');
  logBase = join(tmp, 'base.log');
  mkdirSync(repo);
  mkdirSync(binDir);
  git(['init', '-q', '-b', 'main'], repo);
  mkdirSync(join(repo, 'scripts/apoio'), { recursive: true });
  copyFileSync(PRECI, join(repo, 'scripts/preci.sh'));
  copyFileSync(HELPER, join(repo, 'scripts/apoio/preciBaseVerde.sh'));
  for (const vazio of [
    'scripts/verificar-travessao-arvore.sh',
    'scripts/verificar-v-html.sh',
    'scripts/verificar-proibicoes.sh',
    'scripts/verificar-emails.sh'
  ]) {
    writeFileSync(join(repo, vazio), '');
  }
  commit('a.txt', 'um\n', 'primeiro');

  // node falso: o planejador devolve plano só-segurança e grava a base que recebeu; outros passos
  // passam, salvo o que FALHA_NODE nomeia.
  writeFileSync(
    join(binDir, 'node'),
    `#!/bin/sh
case "$*" in
  *preciSeletivo*)
    prev=""; base=""
    for a in "$@"; do [ "$prev" = "--base" ] && base="$a"; prev="$a"; done
    printf '%s\\n' "$base" > "$LOG_BASE"
    cat <<'PLANO'
PRECI_COMPLETO=0
PRECI_MOTIVO='stub'
PRECI_LINT_RODA=0
PRECI_LINT_ALVO=''
PRECI_LINT_MOTIVO='stub'
PRECI_PRETTIER_RODA=0
PRECI_PRETTIER_ALVO=''
PRECI_PRETTIER_MOTIVO='stub'
PRECI_DEPCRUISE_RODA=0
PRECI_DEPCRUISE_MOTIVO='stub'
PRECI_VUE_TSC_RODA=0
PRECI_VUE_TSC_MOTIVO='stub'
PRECI_CONTEUDO_RODA=0
PRECI_CONTEUDO_MOTIVO='stub'
PRECI_VITEST_RODA=0
PRECI_VITEST_ALVO=''
PRECI_VITEST_MOTIVO='stub'
PRECI_PHP_RODA=0
PRECI_PHP_MOTIVO='stub'
PRECI_PACOTE_REAL_RODA=0
PRECI_PACOTE_REAL_FILTRO='pacote real'
PLANO
    exit 0 ;;
esac
if [ -n "\${FALHA_NODE:-}" ]; then
  case "$*" in *"$FALHA_NODE"*) exit 1 ;; esac
fi
exit 0
`
  );
  writeFileSync(join(binDir, 'npm'), '#!/bin/sh\nexit 0\n');
  writeFileSync(join(binDir, 'npx'), '#!/bin/sh\nexit 0\n');
  chmodSync(join(binDir, 'node'), 0o755);
  chmodSync(join(binDir, 'npm'), 0o755);
  chmodSync(join(binDir, 'npx'), 0o755);
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('preciBaseVerde.sh (leitura e gravação do último verde)', () => {
  it('caminho: honra CADERNO_PRECI_ESTADO, senão XDG_STATE_HOME/caderno-preci/ultimo-verde', () => {
    expect(helper(['caminho']).stdout.trim()).toBe(estado);
    const r = spawnSync('bash', [HELPER, 'caminho'], {
      cwd: repo,
      env: { ...ambiente(), CADERNO_PRECI_ESTADO: '', XDG_STATE_HOME: '/x/estado' },
      encoding: 'utf-8'
    });
    expect(r.stdout.trim()).toBe('/x/estado/caderno-preci/ultimo-verde');
  });

  it('gravar grava o SHA com modo 600; ler devolve o mesmo SHA quando é ancestral do HEAD', () => {
    const sha = git(['rev-parse', 'HEAD']);
    expect(helper(['gravar', sha]).status).toBe(0);
    expect(readFileSync(estado, 'utf-8').trim()).toBe(sha);
    expect(statSync(estado).mode & 0o777).toBe(0o600);
    expect(helper(['ler']).stdout.trim()).toBe(sha);
  });

  it('sem arquivo de estado, ler devolve vazio (rodada completa)', () => {
    expect(existsSync(estado)).toBe(false);
    expect(helper(['ler']).stdout.trim()).toBe('');
  });

  it('SHA que não existe no repositório não vira base', () => {
    const fantasma = 'a'.repeat(40);
    mkdirSync(join(tmp, 'estado'), { recursive: true });
    writeFileSync(estado, fantasma + '\n');
    expect(helper(['ler']).stdout.trim()).toBe('');
  });

  it('SHA existente mas que não é ancestral do HEAD não vira base', () => {
    git(['checkout', '-q', '-b', 'lado']);
    const lado = commit('b.txt', 'lado\n', 'commit do lado');
    git(['checkout', '-q', 'main']);
    commit('c.txt', 'main\n', 'commit do main');
    mkdirSync(join(tmp, 'estado'), { recursive: true });
    writeFileSync(estado, lado + '\n');
    expect(helper(['ler']).stdout.trim()).toBe('');
  });

  it('gravar recusa SHA mal formado e não cria arquivo', () => {
    const r = helper(['gravar', 'nao-e-sha']);
    expect(r.status).not.toBe(0);
    expect(existsSync(estado)).toBe(false);
  });
});

describe('preci.sh com base do último verde', () => {
  it('rodada verde grava o SHA testado (HEAD) no estado', () => {
    const sha = git(['rev-parse', 'HEAD']);
    const r = preci();
    expect(r.status).toBe(0);
    expect(readFileSync(estado, 'utf-8').trim()).toBe(sha);
  });

  it('sem arquivo de estado, a rodada sai completa: base vazia para o planejador', () => {
    const r = preci();
    expect(r.status).toBe(0);
    expect(base()).toBe('');
  });

  it('SHA gravado que é ancestral do HEAD vira a base do planejador', () => {
    const anterior = git(['rev-parse', 'HEAD']);
    commit('d.txt', 'novo\n', 'segundo');
    mkdirSync(join(tmp, 'estado'), { recursive: true });
    writeFileSync(estado, anterior + '\n');
    const r = preci();
    expect(r.status).toBe(0);
    expect(base()).toBe(anterior);
  });

  it('SHA que não é ancestral do HEAD dá rodada completa (base vazia)', () => {
    git(['checkout', '-q', '-b', 'lado']);
    const lado = commit('b.txt', 'lado\n', 'commit do lado');
    git(['checkout', '-q', 'main']);
    commit('c.txt', 'main\n', 'commit do main');
    mkdirSync(join(tmp, 'estado'), { recursive: true });
    writeFileSync(estado, lado + '\n');
    const r = preci();
    expect(r.status).toBe(0);
    expect(base()).toBe('');
  });

  it('passo reprovado não grava o SHA e para no primeiro erro', () => {
    const r = preci({ FALHA_NODE: 'verificar-git-crypt' });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('FALHOU: cifra');
    expect(existsSync(estado)).toBe(false);
  });

  it('árvore rastreada suja: a rodada passa, mas o SHA não é gravado (não testou o commit)', () => {
    writeFileSync(join(repo, 'a.txt'), 'alterado sem commit\n');
    const r = preci();
    expect(r.status).toBe(0);
    expect(existsSync(estado)).toBe(false);
  });

  it('PRECI_BASE_VERDE (modo publicar): usa a variável, não grava e não lê o estado', () => {
    const anterior = git(['rev-parse', 'HEAD']);
    commit('d.txt', 'novo\n', 'segundo');
    const r = preci({ PRECI_BASE_VERDE: anterior });
    expect(r.status).toBe(0);
    expect(base()).toBe(anterior);
    expect(existsSync(estado)).toBe(false);
  });

  it('PRECI_BASE_VERDE vazia (publicar sem estado): rodada completa e sem gravação', () => {
    const r = preci({ PRECI_BASE_VERDE: '' });
    expect(r.status).toBe(0);
    expect(base()).toBe('');
    expect(existsSync(estado)).toBe(false);
  });
});
