import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Portão verificar-particao (plano do CTO, 6.1 linha 385). Reprova qualquer
 * janela de 40 caracteres de texto cifrado que apareça em texto em claro. A
 * comparação é normalizada (caixa, acento, espaço), como o portão de
 * vazamento restrito. Fixtures descartáveis, com chave gerada dentro de cada
 * uma; nada aqui lê a chave real.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = resolve(AQUI, '../..');
const SCRIPT = join(RAIZ_REPO, 'scripts/verificar-particao.ts');
const ATRIBUTOS = 'docs/** filter=git-crypt diff=git-crypt\n.gitattributes !filter !diff\n';

const CIFRADO =
  'A cadeira estuda a função social da propriedade urbana e seus limites legais na prática.\n';

const temporarios: string[] = [];
afterEach(() => {
  for (const pasta of temporarios.splice(0)) rmSync(pasta, { recursive: true, force: true });
});

function git(cwd: string, args: string[]): void {
  const vazio = join(cwd, '.git', 'sem-hooks');
  mkdirSync(vazio, { recursive: true });
  execFileSync(
    'git',
    [
      '-c',
      `core.hooksPath=${vazio}`,
      '-c',
      'user.email=teste@exemplo.invalido',
      '-c',
      'user.name=teste',
      ...args
    ],
    { cwd, stdio: 'ignore' }
  );
}

function fixture(textoEmClaro: string): string {
  const raiz = mkdtempSync(join(tmpdir(), 'portao-particao-'));
  temporarios.push(raiz);
  git(raiz, ['init', '-q', '.']);
  execFileSync('git-crypt', ['init'], { cwd: raiz, stdio: 'ignore' });
  writeFileSync(join(raiz, '.gitattributes'), ATRIBUTOS);
  mkdirSync(join(raiz, 'docs'));
  writeFileSync(join(raiz, 'docs/nota.md'), CIFRADO);
  writeFileSync(join(raiz, 'LEIA.md'), textoEmClaro);
  git(raiz, ['add', '.gitattributes', 'docs/nota.md', 'LEIA.md']);
  git(raiz, ['commit', '-q', '-m', 'teste: particao']);
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

describe('verificar-particao: caminho verde', () => {
  it('texto em claro sem nenhuma janela de 40 caracteres do cifrado: sai 0', () => {
    const { rc, saida } = rodar(fixture('Projeto de teste, sem nenhuma relação com o conteúdo.\n'));
    expect(rc, saida).toBe(0);
    expect(saida).toMatch(/encontrados=0 analisados=\d+ falharam=0/);
  });
});

describe('verificar-particao: sabotagens vermelhas (L-36)', () => {
  it('trecho copiado inteiro do cifrado, com caixa e acento diferentes: sai 1', () => {
    const { rc, saida } = rodar(
      fixture('Anotação: A FUNCAO SOCIAL DA PROPRIEDADE URBANA e seus limites legais, copiado.\n')
    );
    expect(rc).toBe(1);
    expect(saida).toContain('LEIA.md');
  });

  it('janela de exatamente 40 caracteres no meio de uma linha: sai 1', () => {
    // O trecho tem mais de 40 caracteres normalizados, então contém uma janela inteira de 40.
    const trecho = 'a função social da propriedade urbana e seus limites';
    const { rc, saida } = rodar(fixture(`ver ${trecho} ver\n`));
    expect(rc).toBe(1);
    expect(saida).toContain('LEIA.md');
  });

  it('piso: nenhum texto cifrado é varredura quebrada, sai 1', () => {
    const raiz = fixture('texto qualquer em claro, longo o bastante para uma janela.\n');
    writeFileSync(join(raiz, '.gitattributes'), '.gitattributes !filter !diff\n');
    git(raiz, ['commit', '-q', '-am', 'teste: remove o cifrado do atributo']);
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toMatch(/cifrados_texto=0/);
  });
});
