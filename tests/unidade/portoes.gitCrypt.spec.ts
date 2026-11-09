import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Portão verificar-git-crypt (plano do CTO, 6.2 e F1.2). Cada teste monta um
 * repositório descartável com git-crypt init: a chave é gerada dentro da
 * fixture e nunca é a chave real do repositório. Nada aqui lê a chave real.
 *
 * Prova vermelha (L-36): cada caso de falha tem um teste próprio que deve
 * sair 1; o caso verde sai 0 com encontrados = analisados e falharam = 0.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = resolve(AQUI, '../..');
const SCRIPT = join(RAIZ_REPO, 'scripts/verificar-git-crypt.ts');

const ATRIBUTOS_DOCS = 'docs/** filter=git-crypt diff=git-crypt\n.gitattributes !filter !diff\n';

const temporarios: string[] = [];
afterEach(() => {
  for (const pasta of temporarios.splice(0)) rmSync(pasta, { recursive: true, force: true });
});

function git(cwd: string, args: string[], extra: string[] = []): void {
  // hooks globais da máquina não rodam dentro de fixture: pasta vazia dentro do .git da própria fixture.
  const vazio = join(cwd, '.git', 'sem-hooks');
  mkdirSync(vazio, { recursive: true });
  execFileSync(
    'git',
    [
      '-c',
      `core.hooksPath=${vazio}`,
      '-c',
      'user.email=teste@example.com',
      '-c',
      'user.name=teste',
      '-c',
      'commit.gpgsign=false',
      ...extra,
      ...args
    ],
    { cwd, stdio: 'ignore' }
  );
}

/** Repositório com git-crypt já destravado e um commit com um arquivo cifrado em docs/. */
function fixtureCifrada(atributos = ATRIBUTOS_DOCS): string {
  const raiz = mkdtempSync(join(tmpdir(), 'portao-gc-'));
  temporarios.push(raiz);
  git(raiz, ['init', '-q', '.']);
  execFileSync('git-crypt', ['init'], { cwd: raiz, stdio: 'ignore' });
  writeFileSync(join(raiz, '.gitattributes'), atributos);
  mkdirSync(join(raiz, 'docs'));
  writeFileSync(
    join(raiz, 'docs/nota.md'),
    '# Nota sintética\n\nTexto de teste sem conteúdo real.\n'
  );
  writeFileSync(join(raiz, 'README.md'), '# Projeto de teste\n');
  git(raiz, ['add', '.gitattributes', 'docs/nota.md', 'README.md']);
  git(raiz, ['commit', '-q', '-m', 'teste: cifrado']);
  return raiz;
}

function rodar(raiz: string): { rc: number; saida: string } {
  try {
    const saida = execFileSync(process.execPath, ['--import', 'tsx', SCRIPT], {
      cwd: RAIZ_REPO,
      env: { ...process.env, REPO_RAIZ: raiz },
      encoding: 'utf-8',
      timeout: 120_000,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { rc: 0, saida };
  } catch (erro) {
    const e = erro as { status?: number; stdout?: string; stderr?: string };
    return { rc: e.status ?? -1, saida: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

describe('verificar-git-crypt: caminho verde', () => {
  it('árvore destravada e todo cifrado com magia: sai 0, encontrados = analisados, falharam = 0', () => {
    const { rc, saida } = rodar(fixtureCifrada());
    expect(rc, saida).toBe(0);
    expect(saida).toMatch(/encontrados=1 analisados=1 falharam=0/);
  });
});

describe('verificar-git-crypt: sabotagens vermelhas (L-36)', () => {
  it('árvore trancada: sai 1 e aponta o caminho que está cifrado na working tree', () => {
    const raiz = fixtureCifrada();
    execFileSync('git-crypt', ['lock'], { cwd: raiz, stdio: 'ignore' });
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toContain('docs/nota.md');
  });

  it('blob em claro em caminho cifrado: sai 1 e aponta o caminho', () => {
    const raiz = fixtureCifrada();
    writeFileSync(join(raiz, 'docs/claro.md'), '# Sem cifra\n');
    git(raiz, ['add', 'docs/claro.md'], ['-c', 'filter.git-crypt.clean=cat']);
    git(raiz, ['commit', '-q', '-m', 'teste: arquivo novo em docs sem filtro']);
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toContain('docs/claro.md');
  });

  it('nome proibido rastreado (juri.json): sai 1', () => {
    const raiz = fixtureCifrada();
    writeFileSync(join(raiz, 'juri.json'), '{}\n');
    git(raiz, ['add', 'juri.json']);
    git(raiz, ['commit', '-q', '-m', 'teste: nome proibido']);
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toContain('juri.json');
  });

  it('piso de varredura: nenhum caminho cifrado é varredura quebrada, sai 1', () => {
    const raiz = fixtureCifrada('.gitattributes !filter !diff\n');
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toMatch(/encontrados=0/);
  });
});
