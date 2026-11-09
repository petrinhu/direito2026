import { execFileSync, spawn } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  closeSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  chmodSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh, sinal durante o preci (LU-F1.3, L-25, L-36). Um sinal
 * (TERM, INT ou HUP) entregue ao processo do publicar enquanto o preci roda não
 * pode deixar commit de release nem tag em main. Antes da correção, o EXIT
 * trap lia código 0 e apagava o diagnóstico sem desfazer nada.
 *
 * Fixture descartável em tmpdir(): repositório com git-crypt e chave gerada aqui,
 * remoto bare local, preci falso que grava um marcador e dorme 3 s. Nada toca o
 * repositório real nem a chave real. O script copiado é o do próprio repositório,
 * no instante do teste. A configuração global do git fica de fora (hooks do líder).
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = resolve(AQUI, '../..');
const TEMPO_MAXIMO_MS = 60_000;
type Sinal = 'SIGTERM' | 'SIGINT' | 'SIGHUP';

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
  // Config passada pelo ambiente (GIT_CONFIG_COUNT e pares KEY_n/VALUE_n) também entra no git do teste:
  // sem limpar, um remoto de fora (um ensaio com a árvore real) redirecionava o push da fixture.
  for (const chave of Object.keys(ambiente)) {
    if (/^GIT_CONFIG_(COUNT|KEY_\d+|VALUE_\d+)$/.test(chave)) {
      delete ambiente[chave];
    }
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
  marcador: string;
  caixa: string;
  chave: string;
  restrito: string;
  home: string;
}

/** Repositório descartável com o publicar do próprio repositório, preci falso e remoto bare local. */
function montarFixture(): Fixture {
  const raiz = pastaTemporaria('publicar-sinal-');
  const bare = pastaTemporaria('publicar-sinal-bare-');
  const home = pastaTemporaria('publicar-sinal-home-');
  const chaveDir = pastaTemporaria('publicar-sinal-chave-');
  const marcador = join(chaveDir, 'preci-iniciou');
  const chave = join(chaveDir, 'chave-descartavel');
  const caixa = join(chaveDir, 'caixa-falsa.sh');
  const restrito = join(chaveDir, 'restrito-sintetico.json');

  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', bare], { env: ambienteGit() });
  execFileSync('git', ['init', '-q', '-b', 'main', raiz], { env: ambienteGit() });
  const vazio = join(raiz, '.git', 'sem-hooks');
  mkdirSync(vazio, { recursive: true });
  git(raiz, ['config', '--local', 'core.hooksPath', vazio]);
  git(raiz, ['config', '--local', 'commit.gpgSign', 'false']);
  // O publicar commita e cria tag sem as opções -c do teste: a identidade precisa estar na config local.
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
  escrever(
    join(raiz, 'scripts/preci.sh'),
    '#!/usr/bin/env bash\n# preci falso: nunca roda aqui, só marca a chamada no ensaio sintético.\nexit 0\n'
  );
  mkdirSync(join(raiz, 'scripts/apoio'), { recursive: true });
  copyFileSync(join(RAIZ_REPO, 'scripts/publicar.sh'), join(raiz, 'scripts/publicar.sh'));
  for (const nome of ['dispositivos-publicacao.sh', 'versao.ts', 'versao-cli.ts']) {
    copyFileSync(join(RAIZ_REPO, 'scripts/apoio', nome), join(raiz, 'scripts/apoio', nome));
  }
  symlinkSync(join(RAIZ_REPO, 'node_modules'), join(raiz, 'node_modules'), 'dir');
  escrever(restrito, '{"sintetico": true}\n');

  // Caixa falsa: só executa o comando, depois de gravar o marcador. O preci falso dorme 3 s.
  escrever(caixa, `#!/usr/bin/env bash\ntouch -- "${marcador}"\nexec sleep 3\n`);
  chmodSync(caixa, 0o755);

  git(raiz, ['add', '.gitattributes', '.gitignore', 'package.json', 'segredo/nota.txt']);
  git(raiz, ['add', 'src', 'scripts']);
  git(raiz, ['commit', '-q', '-m', 'teste: base sintetica']);
  git(raiz, ['remote', 'add', 'github', bare]);
  git(raiz, ['push', '-q', 'github', 'main']);
  // Destino local (ensaio): a raiz da hospedagem falsa existe, para a checagem de destino seguro (F5.2).
  mkdirSync(join(home, 'domains', 'drpetrus.top'), { recursive: true });
  return { raiz, marcador, caixa, chave, restrito, home };
}

function ambientePublicar(f: Fixture): Record<string, string | undefined> {
  return {
    PATH: process.env.PATH ?? '/usr/bin:/bin',
    HOME: f.home,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    CADERNO_CAIXA: f.caixa,
    CADERNO_CHAVE_GIT_CRYPT: f.chave,
    CADERNO_RESTRITO: f.restrito,
    CADERNO_RESTRITO_JURI: '',
    // Ensaio local: nenhum ssh para a hospedagem real neste teste (destino vazio = local).
    PUBLICAR_DESTINO_HOST: '',
    PUBLICAR_DESTINO_RAIZ: join(f.home, 'domains', 'drpetrus.top')
  };
}

async function esperarMarcador(marcador: string): Promise<void> {
  const inicio = Date.now();
  while (!existsSync(marcador)) {
    if (Date.now() - inicio > TEMPO_MAXIMO_MS - 5_000) {
      throw new Error('o preci falso nunca iniciou');
    }
    await new Promise((resolver) => setTimeout(resolver, 50));
  }
}

interface Saida {
  codigo: number;
  texto: string;
}

/** Roda o publicar, manda o sinal ao processo dele durante o preci e espera a saída. */
async function publicarComSinal(f: Fixture, sinal: Sinal): Promise<Saida> {
  const log = join(pastaTemporaria('publicar-sinal-log-'), 'saida.txt');
  const fd = openSync(log, 'w');
  try {
    const filho = spawn('bash', ['scripts/publicar.sh', 'recurso'], {
      cwd: f.raiz,
      env: ambientePublicar(f),
      stdio: ['ignore', fd, fd]
    });
    const saida = new Promise<{ code: number | null; signal: string | null }>((resolver) => {
      filho.on('exit', (code, signal) => resolver({ code, signal }));
    });
    try {
      await esperarMarcador(f.marcador);
    } catch (erro) {
      filho.kill('SIGKILL');
      await saida;
      throw new Error(`${String(erro)}\nsaída do publicar:\n${readFileSync(log, 'utf-8')}`);
    }
    filho.kill(sinal);
    const { code, signal } = await saida;
    const codigo = code ?? 128 + (signal ? signalNumero(signal) : 0);
    return { codigo, texto: readFileSync(log, 'utf-8') };
  } finally {
    closeSync(fd);
  }
}

function signalNumero(sinal: string): number {
  const mapa: Readonly<Record<string, number>> = { SIGHUP: 1, SIGINT: 2, SIGTERM: 15 };
  return mapa[sinal] ?? 0;
}

/** Diagnóstico que o próprio script diz ter mantido: só a pasta /var/tmp/publicar.* dele. */
function registrarDiagnostico(texto: string): void {
  const achado = texto.match(/mantidos em (\/var\/tmp\/publicar\.[A-Za-z0-9]+)/);
  if (achado?.[1]) temporarios.push(achado[1]);
}

describe('publicar.sh: sinal durante o preci desfaz commit e tag (LU-F1.3)', () => {
  const casos: [Sinal, number][] = [
    ['SIGTERM', 143],
    ['SIGINT', 130],
    ['SIGHUP', 129]
  ];

  for (const [sinal, esperado] of casos) {
    it(
      `${sinal} durante o preci: HEAD, tag e package.json voltam, e o código de saída é ${esperado}`,
      async () => {
        const f = montarFixture();
        const headAntes = git(f.raiz, ['rev-parse', 'HEAD']).trim();
        const pacoteAntes = readFileSync(join(f.raiz, 'package.json'), 'utf-8');

        const { codigo, texto } = await publicarComSinal(f, sinal);
        registrarDiagnostico(texto);

        expect(git(f.raiz, ['rev-parse', 'HEAD']).trim()).toBe(headAntes);
        expect(git(f.raiz, ['tag', '--list', 'v*']).trim()).toBe('');
        expect(git(f.raiz, ['status', '--porcelain', '--untracked-files=no']).trim()).toBe('');
        expect(readFileSync(join(f.raiz, 'package.json'), 'utf-8')).toBe(pacoteAntes);
        expect(texto).toContain('desfeito');
        expect(codigo).toBe(esperado);
      },
      TEMPO_MAXIMO_MS
    );
  }
});
