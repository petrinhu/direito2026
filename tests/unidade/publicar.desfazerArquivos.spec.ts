import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh, desfazer só o que o próprio publicar escreveu (LU-F1.3-N2, L-25).
 *
 * Depois de copiar package.json e docs/versoes/novidades.json do clone para R, o publicar pode
 * abortar antes do commit. O desfazer antigo fazia `git checkout --` nos dois arquivos e apagava
 * qualquer edição feita por fora entre a cópia e o aborto. Aqui o gancho pre-commit da fixture faz
 * esse papel: escreve na R (edição externa) e reprova o commit, como um hook de segurança faria.
 *
 * Fixture descartável em tmpdir(). Nada toca o repositório real, o clone real nem a chave real.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = resolve(AQUI, '../..');
const TEMPO_MAXIMO_MS = 60_000;
const PACOTE_ORIGINAL = '{\n  "name": "fixture",\n  "version": "1.5.0.0",\n  "private": true\n}\n';
const NOVIDADES_ORIGINAL = '{"versoes": []}\n';

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

/** Caixa falsa: deixa o pacote que o publicar confere e sai com 0 (o preci "passa"). */
const CAIXA_COM_PACOTE = [
  '#!/usr/bin/env bash',
  'mkdir -p dist-pacote/app dist-pacote/webroot/api',
  ': > dist-pacote/app/manifesto.json',
  ': > dist-pacote/webroot/api/portao.php',
  'v=$(sed -n \'s/.*"version": *"\\([^"]*\\)".*/\\1/p\' package.json)',
  'printf \'{"historico":[{"versao":"%s"}]}\\n\' "$v" > dist-pacote/app/versao.json',
  'exit 0',
  ''
].join('\n');

interface Fixture {
  raiz: string;
  home: string;
  caixa: string;
  chave: string;
  restrito: string;
  hooks: string;
}

/** Repositório descartável com o publicar do próprio repositório, preci falso e remoto bare local. */
function montarFixture(): Fixture {
  const raiz = pastaTemporaria('publicar-desfazer-');
  const bare = pastaTemporaria('publicar-desfazer-bare-');
  const home = pastaTemporaria('publicar-desfazer-home-');
  const chaveDir = pastaTemporaria('publicar-desfazer-chave-');
  const chave = join(chaveDir, 'chave-descartavel');
  const caixa = join(chaveDir, 'caixa-falsa.sh');
  const restrito = join(chaveDir, 'restrito-sintetico.json');

  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', bare], { env: ambienteGit() });
  execFileSync('git', ['init', '-q', '-b', 'main', raiz], { env: ambienteGit() });
  const hooks = join(raiz, '.git', 'sem-hooks');
  mkdirSync(hooks, { recursive: true });
  git(raiz, ['config', '--local', 'core.hooksPath', hooks]);
  git(raiz, ['config', '--local', 'commit.gpgSign', 'false']);
  git(raiz, ['config', '--local', 'user.name', 'teste']);
  git(raiz, ['config', '--local', 'user.email', 'teste@example.com']);
  execFileSync('git-crypt', ['init'], { cwd: raiz, env: ambienteGit(), stdio: 'ignore' });
  execFileSync('git-crypt', ['export-key', chave], {
    cwd: raiz,
    env: ambienteGit(),
    stdio: 'ignore'
  });

  escrever(join(raiz, 'package.json'), PACOTE_ORIGINAL);
  escrever(join(raiz, '.gitignore'), 'node_modules\n.worktrees/\n');
  escrever(join(raiz, '.gitattributes'), 'segredo/** filter=git-crypt diff=git-crypt\n');
  escrever(join(raiz, 'segredo/nota.txt'), 'conteúdo sintético cifrado\n');
  escrever(join(raiz, 'src/conteudo/p1/cad/u1/dispositivos.ts'), 'export const d = [];\n');
  escrever(join(raiz, 'docs/versoes/novidades.json'), NOVIDADES_ORIGINAL);
  escrever(join(home, 'termos-sinteticos.txt'), 'termosintetico\n');
  escrever(
    join(raiz, 'scripts/preci.sh'),
    '#!/usr/bin/env bash\n# preci falso: nunca roda aqui.\nexit 0\n'
  );
  mkdirSync(join(raiz, 'scripts/apoio'), { recursive: true });
  copyFileSync(join(RAIZ_REPO, 'scripts/publicar.sh'), join(raiz, 'scripts/publicar.sh'));
  for (const nome of [
    'dispositivos-publicacao.sh',
    'versao.ts',
    'versao-cli.ts',
    'recibo-navegador.sh'
  ]) {
    copyFileSync(join(RAIZ_REPO, 'scripts/apoio', nome), join(raiz, 'scripts/apoio', nome));
  }
  symlinkSync(join(RAIZ_REPO, 'node_modules'), join(raiz, 'node_modules'), 'dir');
  escrever(restrito, '{"sintetico": true}\n');
  escrever(caixa, CAIXA_COM_PACOTE);
  chmodSync(caixa, 0o755);

  git(raiz, ['add', '.gitattributes', '.gitignore', 'package.json', 'segredo/nota.txt']);
  git(raiz, ['add', 'src', 'scripts', 'docs']);
  git(raiz, ['commit', '-q', '-m', 'teste: base sintetica']);
  git(raiz, ['remote', 'add', 'github', bare]);
  git(raiz, ['push', '-q', 'github', 'main']);
  gravarReciboSintetico(raiz, join(home, '.local', 'state', 'caderno-publicar'));
  mkdirSync(join(home, 'domains', 'drpetrus.top'), { recursive: true });
  return { raiz, home, caixa, chave, restrito, hooks };
}

/** Gancho pre-commit da fixture: roda depois da cópia do clone para R e antes do commit de release. */
function instalarGancho(f: Fixture, corpo: string): void {
  const gancho = join(f.hooks, 'pre-commit');
  writeFileSync(gancho, `#!/usr/bin/env bash\n${corpo}\n`);
  chmodSync(gancho, 0o755);
}

/** Roda o publicar até o fim (sem sinal) e devolve o código de saída e o texto. */
/**
 * Recibo verde sintético (CISO-52-PUBLICAR): o hash vem do próprio script sobre as partes desta fixture
 * (aqui não há public/api nem tests/e2e-portao). O teste exercita o gate real; não o contorna.
 */
function gravarReciboSintetico(raiz: string, pastaPacotes: string): void {
  const hash = execFileSync('bash', [join(raiz, 'scripts/apoio/recibo-navegador.sh'), 'hash'], {
    cwd: raiz,
    env: ambienteGit(),
    encoding: 'utf-8'
  }).trim();
  const recibos = join(pastaPacotes, 'recibos');
  mkdirSync(recibos, { recursive: true, mode: 0o700 });
  writeFileSync(
    join(recibos, 'navegador.recibo'),
    `sha=sintetico\npartes=${hash}\nresultado=verde\n`
  );
}

function publicar(f: Fixture): { codigo: number | null; texto: string } {
  const r = spawnSync('bash', ['scripts/publicar.sh', 'recurso', '--novidade', 'tecnica'], {
    cwd: f.raiz,
    env: {
      PATH: process.env.PATH ?? '/usr/bin:/bin',
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
    encoding: 'utf-8',
    timeout: TEMPO_MAXIMO_MS - 5_000
  });
  const texto = `${r.stdout}${r.stderr}`;
  const achado = texto.match(/mantidos em (\/var\/tmp\/publicar\.[A-Za-z0-9]+)/);
  if (achado?.[1]) temporarios.push(achado[1]);
  return { codigo: r.status, texto };
}

describe('publicar.sh: o desfazer não apaga edição feita por fora depois da cópia (LU-F1.3-N2)', () => {
  it(
    'edição externa em package.json entre a cópia e o commit sobrevive ao aborto; novidades.json volta ao base',
    () => {
      const f = montarFixture();
      const headAntes = git(f.raiz, ['rev-parse', 'HEAD']).trim();
      instalarGancho(f, `printf 'EDICAO EXTERNA\\n' >> "${f.raiz}/package.json"\nexit 1`);

      const { codigo, texto } = publicar(f);

      expect(codigo).not.toBe(0);
      expect(git(f.raiz, ['rev-parse', 'HEAD']).trim()).toBe(headAntes);
      expect(git(f.raiz, ['tag', '--list', 'v*']).trim()).toBe('');
      // A cópia do publicar (versão nova, 1.6.0.0) fica, e a edição externa também: nada é apagado.
      expect(readFileSync(join(f.raiz, 'package.json'), 'utf-8')).toBe(
        `${PACOTE_ORIGINAL.replace('"1.5.0.0"', '"1.6.0.0"')}EDICAO EXTERNA\n`
      );
      expect(readFileSync(join(f.raiz, 'docs/versoes/novidades.json'), 'utf-8')).toBe(
        NOVIDADES_ORIGINAL
      );
      expect(texto).toContain('editado depois da cópia');
    },
    TEMPO_MAXIMO_MS
  );

  it(
    'sem edição externa, o aborto devolve package.json e novidades.json ao base e não mexe no HEAD',
    () => {
      const f = montarFixture();
      const headAntes = git(f.raiz, ['rev-parse', 'HEAD']).trim();
      instalarGancho(f, 'exit 1');

      const { codigo } = publicar(f);

      expect(codigo).not.toBe(0);
      expect(git(f.raiz, ['rev-parse', 'HEAD']).trim()).toBe(headAntes);
      expect(git(f.raiz, ['tag', '--list', 'v*']).trim()).toBe('');
      expect(readFileSync(join(f.raiz, 'package.json'), 'utf-8')).toBe(PACOTE_ORIGINAL);
      expect(readFileSync(join(f.raiz, 'docs/versoes/novidades.json'), 'utf-8')).toBe(
        NOVIDADES_ORIGINAL
      );
      expect(git(f.raiz, ['status', '--porcelain', '--untracked-files=no']).trim()).toBe('');
    },
    TEMPO_MAXIMO_MS
  );
});
