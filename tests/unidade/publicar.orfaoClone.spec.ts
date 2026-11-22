import { execFileSync, spawn } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh, clone órfão (LU-F1.3-N1). Um kill no grupo do processo chega entre a criação
 * da pasta `pub-clone.*` e o registro do caminho em CLONE. Antes da correção, o trap não sabia o
 * que apagar e a pasta ficava em `.worktrees/`.
 *
 * O kill no grupo é simulado por um `mkdir` e um `mktemp` de mentira no PATH: quando o pedido é a
 * pasta `pub-clone.*`, o shim cria a pasta de verdade e manda SIGTERM ao grupo do publicar (o
 * próprio shim está nesse grupo), antes de devolver qualquer caminho. Fixture descartável em
 * tmpdir(). Nada toca o repositório real nem o clone real.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = resolve(AQUI, '../..');
const TEMPO_MAXIMO_MS = 60_000;

const temporarios: string[] = [];
afterEach(() => {
  for (const pasta of temporarios.splice(0)) rmSync(pasta, { recursive: true, force: true });
});

function ambienteGit(): Record<string, string | undefined> {
  const ambiente: Record<string, string | undefined> = {
    ...process.env,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1'
  };
  for (const chave of Object.keys(ambiente)) {
    if (/^GIT_CONFIG_(COUNT|KEY_\d+|VALUE_\d+)$/.test(chave)) delete ambiente[chave];
  }
  return ambiente;
}

function git(cwd: string, args: string[]): string {
  return execFileSync(
    'git',
    [
      '-c',
      'user.name=teste',
      '-c',
      'user.email=teste@example.com',
      '-c',
      'commit.gpgSign=false',
      ...args
    ],
    { cwd, env: ambienteGit(), encoding: 'utf-8' }
  );
}

function escrever(caminho: string, conteudo: string): void {
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, conteudo);
}

function pastaTemporaria(prefixo: string): string {
  const pasta = mkdtempSync(join(tmpdir(), prefixo));
  temporarios.push(pasta);
  return pasta;
}

interface Fixture {
  raiz: string;
  home: string;
  caixa: string;
  chave: string;
  restrito: string;
  shims: string;
}

/** Repositório descartável com o publicar do próprio repositório, preci falso e remoto bare local. */
function montarFixture(): Fixture {
  const raiz = pastaTemporaria('publicar-orfao-');
  const bare = pastaTemporaria('publicar-orfao-bare-');
  const home = pastaTemporaria('publicar-orfao-home-');
  const chaveDir = pastaTemporaria('publicar-orfao-chave-');
  const shims = pastaTemporaria('publicar-orfao-shims-');
  const chave = join(chaveDir, 'chave-descartavel');
  const caixa = join(chaveDir, 'caixa-falsa.sh');
  const restrito = join(chaveDir, 'restrito-sintetico.json');

  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', bare], { env: ambienteGit() });
  execFileSync('git', ['init', '-q', '-b', 'main', raiz], { env: ambienteGit() });
  const vazio = join(raiz, '.git', 'sem-hooks');
  mkdirSync(vazio, { recursive: true });
  git(raiz, ['config', '--local', 'core.hooksPath', vazio]);
  git(raiz, ['config', '--local', 'commit.gpgSign', 'false']);
  git(raiz, ['config', '--local', 'user.name', 'teste']);
  git(raiz, ['config', '--local', 'user.email', 'teste@example.com']);
  execFileSync('git-crypt', ['init'], { cwd: raiz, env: ambienteGit(), stdio: 'ignore' });
  execFileSync('git-crypt', ['export-key', chave], {
    cwd: raiz,
    env: ambienteGit(),
    stdio: 'ignore'
  });

  escrever(
    join(raiz, 'package.json'),
    '{\n  "name": "fixture",\n  "version": "1.5.0.0",\n  "private": true\n}\n'
  );
  escrever(join(raiz, '.gitignore'), 'node_modules\n.worktrees/\n');
  escrever(join(raiz, '.gitattributes'), 'segredo/** filter=git-crypt diff=git-crypt\n');
  escrever(join(raiz, 'segredo/nota.txt'), 'conteúdo sintético cifrado\n');
  escrever(join(raiz, 'src/conteudo/p1/cad/u1/dispositivos.ts'), 'export const d = [];\n');
  escrever(join(raiz, 'docs/versoes/novidades.json'), '{"versoes": []}\n');
  escrever(join(home, 'termos-sinteticos.txt'), 'termosintetico\n');
  escrever(
    join(raiz, 'scripts/preci.sh'),
    '#!/usr/bin/env bash\n# preci falso: nunca roda aqui.\nexit 0\n'
  );
  mkdirSync(join(raiz, 'scripts/apoio'), { recursive: true });
  copyFileSync(join(RAIZ_REPO, 'scripts/publicar.sh'), join(raiz, 'scripts/publicar.sh'));
  for (const nome of ['dispositivos-publicacao.sh', 'versao.ts', 'versao-cli.ts']) {
    copyFileSync(join(RAIZ_REPO, 'scripts/apoio', nome), join(raiz, 'scripts/apoio', nome));
  }
  symlinkSync(join(RAIZ_REPO, 'node_modules'), join(raiz, 'node_modules'), 'dir');
  escrever(restrito, '{"sintetico": true}\n');
  escrever(caixa, '#!/usr/bin/env bash\nexit 0\n');
  chmodSync(caixa, 0o755);

  git(raiz, ['add', '.gitattributes', '.gitignore', 'package.json', 'segredo/nota.txt']);
  git(raiz, ['add', 'src', 'scripts', 'docs']);
  git(raiz, ['commit', '-q', '-m', 'teste: base sintetica']);
  git(raiz, ['remote', 'add', 'github', bare]);
  git(raiz, ['push', '-q', 'github', 'main']);
  mkdirSync(join(home, 'domains', 'drpetrus.top'), { recursive: true });
  return { raiz, home, caixa, chave, restrito, shims };
}

/** Shim de `mkdir` ou `mktemp`: no pedido de `pub-clone.*`, cria a pasta e mata o grupo (ver o cabeçalho). */
function corpoShim(real: string): string {
  return [
    '#!/usr/bin/env bash',
    'for argumento in "$@"; do',
    '  case "$argumento" in',
    '    *pub-clone.*)',
    `      "${real}" "$@" >/dev/null`,
    "      grupo=$(awk '{print $5}' /proc/$$/stat)",
    '      kill -TERM -- "-$grupo"',
    '      sleep 5',
    '      exit 1 ;;',
    '  esac',
    'done',
    `exec "${real}" "$@"`,
    ''
  ].join('\n');
}

function instalarShims(f: Fixture): void {
  for (const nome of ['mkdir', 'mktemp']) {
    const real = execFileSync('bash', ['-c', `command -v ${nome}`], { encoding: 'utf-8' }).trim();
    const caminho = join(f.shims, nome);
    writeFileSync(caminho, corpoShim(real));
    chmodSync(caminho, 0o755);
  }
}

/** Roda o publicar em grupo próprio (detached), para que o kill no grupo atinja só ele e o shim. */
function publicarComKillNoGrupo(
  f: Fixture
): Promise<{ codigo: number | null; sinal: string | null }> {
  instalarShims(f);
  return new Promise((resolver, rejeitar) => {
    const filho = spawn('bash', ['scripts/publicar.sh', 'recurso', '--novidade', 'tecnica'], {
      cwd: f.raiz,
      detached: true,
      env: {
        PATH: `${f.shims}:${process.env.PATH ?? '/usr/bin:/bin'}`,
        HOME: f.home,
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_CONFIG_NOSYSTEM: '1',
        CADERNO_CAIXA: f.caixa,
        CADERNO_CHAVE_GIT_CRYPT: f.chave,
        CADERNO_RESTRITO: f.restrito,
        CADERNO_RESTRITO_JURI: '',
        PUBLICAR_CODIGO: RAIZ_REPO,
        VERIFICAR_PROIBICOES_TERMOS: join(f.home, 'termos-sinteticos.txt'),
        PUBLICAR_DESTINO_HOST: '',
        PUBLICAR_DESTINO_RAIZ: join(f.home, 'domains', 'drpetrus.top')
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let texto = '';
    filho.stdout?.on('data', (pedaco: Buffer) => (texto += pedaco.toString()));
    filho.stderr?.on('data', (pedaco: Buffer) => (texto += pedaco.toString()));
    const prazo = setTimeout(() => {
      filho.kill('SIGKILL');
      rejeitar(new Error('o publicar não terminou no prazo'));
    }, TEMPO_MAXIMO_MS - 5_000);
    filho.on('exit', (codigo, sinal) => {
      clearTimeout(prazo);
      // O publicar mantém a pasta de diagnóstico /var/tmp/publicar.* quando sai com erro: ela é deste teste.
      const diagnostico = texto.match(/mantidos em (\/var\/tmp\/publicar\.[A-Za-z0-9]+)/);
      if (diagnostico?.[1]) temporarios.push(diagnostico[1]);
      resolver({ codigo, sinal });
    });
  });
}

describe('publicar.sh: kill no grupo entre a criação do clone e o registro não deixa pub-clone.* órfão (LU-F1.3-N1)', () => {
  it(
    'nenhuma pasta pub-clone.* sobra em .worktrees/, nada é commitado nem tagueado, e o publicar não sai com sucesso',
    async () => {
      const f = montarFixture();
      const headAntes = git(f.raiz, ['rev-parse', 'HEAD']).trim();

      const saida = await publicarComKillNoGrupo(f);

      const pastaWorktrees = join(f.raiz, '.worktrees');
      const orfaos = existsSync(pastaWorktrees)
        ? readdirSync(pastaWorktrees).filter((nome) => nome.startsWith('pub-clone.'))
        : [];
      expect(orfaos).toEqual([]);
      expect(git(f.raiz, ['rev-parse', 'HEAD']).trim()).toBe(headAntes);
      expect(git(f.raiz, ['tag', '--list', 'v*']).trim()).toBe('');
      expect(saida.codigo !== 0 || saida.sinal !== null).toBe(true);
    },
    TEMPO_MAXIMO_MS
  );
});
