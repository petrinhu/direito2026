import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Portão verificar-travessao-arvore (plano do CTO, 6.3 e F1.2). Reprova U+2014 e
 * U+2013 em todo arquivo cifrado, lido da working tree destravada. Isenção única:
 * o campo "blocos" do texto integral (src/core/conteudo/semTextoFiel.ts:10-13).
 *
 * Os caracteres de travessão aparecem aqui só como escape (\u2014, \u2013), para
 * que nenhum arquivo versionado carregue o caractere.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = resolve(AQUI, '../..');
const SCRIPT = join(RAIZ_REPO, 'scripts/verificar-travessao-arvore.sh');
const EM = '\u2014';
const EN = '\u2013';
const ATRIBUTOS =
  'docs/** filter=git-crypt diff=git-crypt\nsrc/conteudo/** filter=git-crypt diff=git-crypt\n.gitattributes !filter !diff\n';

const TEXTO_INTEGRAL_COM_BLOCO = (travessaoNoTitulo: string, travessaoNoBloco: string): string =>
  'export const textoIntegral: TextoIntegral = {\n' +
  `  "titulo": "Titulo ${travessaoNoTitulo} sintetico",\n` +
  '  "blocos": [\n' +
  `    { "texto": "trecho de obra de terceiro ${travessaoNoBloco} mantido" }\n` +
  '  ],\n' +
  '  "fonte": "fonte sintetica"\n' +
  '};\n';

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

/** Fixture com git-crypt destravado: docs/nota.md limpo, texto integral com travessões onde se pede. */
function fixture(docs: string, textoIntegral: string | undefined): string {
  const raiz = mkdtempSync(join(tmpdir(), 'portao-travessao-'));
  temporarios.push(raiz);
  git(raiz, ['init', '-q', '.']);
  execFileSync('git-crypt', ['init'], { cwd: raiz, stdio: 'ignore' });
  writeFileSync(join(raiz, '.gitattributes'), ATRIBUTOS);
  mkdirSync(join(raiz, 'docs'));
  writeFileSync(join(raiz, 'docs/nota.md'), docs);
  const arquivos = ['.gitattributes', 'docs/nota.md'];
  if (textoIntegral !== undefined) {
    mkdirSync(join(raiz, 'src/conteudo/sintetico'), { recursive: true });
    writeFileSync(join(raiz, 'src/conteudo/sintetico/textoIntegral.ts'), textoIntegral);
    arquivos.push('src/conteudo/sintetico/textoIntegral.ts');
  }
  git(raiz, ['add', ...arquivos]);
  git(raiz, ['commit', '-q', '-m', 'teste: travessao']);
  return raiz;
}

function rodar(raiz: string): { rc: number; saida: string } {
  try {
    const saida = execFileSync('bash', [SCRIPT], {
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

describe('verificar-travessao-arvore: caminho verde', () => {
  it('cifrados sem travessão e travessão só dentro de "blocos" do texto integral: sai 0', () => {
    const raiz = fixture('Texto sintetico sem travessao.\n', TEXTO_INTEGRAL_COM_BLOCO('sem', EM));
    const { rc, saida } = rodar(raiz);
    expect(rc, saida).toBe(0);
    expect(saida).toMatch(/falharam=0/);
  });
});

describe('verificar-travessao-arvore: sabotagens vermelhas (L-36)', () => {
  it('U+2014 em arquivo cifrado de docs/: sai 1 e aponta o arquivo', () => {
    const raiz = fixture(`Texto com ${EM} plantado.\n`, undefined);
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toContain('docs/nota.md');
  });

  it('U+2013 (en-dash) em arquivo cifrado de docs/: sai 1', () => {
    const raiz = fixture(`Texto com ${EN} plantado.\n`, undefined);
    const { rc } = rodar(raiz);
    expect(rc).toBe(1);
  });

  it('travessão no título do texto integral, fora de "blocos": sai 1 (a isenção não cobre o título)', () => {
    const raiz = fixture('Texto sintetico sem travessao.\n', TEXTO_INTEGRAL_COM_BLOCO(EM, 'sem'));
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toContain('src/conteudo/sintetico/textoIntegral.ts');
  });

  it('piso: nenhum arquivo cifrado analisado é varredura quebrada, sai 1', () => {
    const raiz = fixture('texto sintetico\n', undefined);
    writeFileSync(join(raiz, '.gitattributes'), '.gitattributes !filter !diff\n');
    git(raiz, ['commit', '-q', '-am', 'teste: sem cifrados']);
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toMatch(/analisados=0/);
  });
});
