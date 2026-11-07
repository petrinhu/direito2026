import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Portão verificar-travessao-arvore (plano do CTO, 6.3, E7 e F1.2b). Reprova
 * U+2014 e U+2013 no que chega ao leitor: arquivo cifrado das classes que
 * varrem (src/conteudo, src/dados, site, mockups), lido da working tree
 * destravada. Caminho cifrado sem classe reprova (falha fechada). Isenção única:
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
const SINTETICO = 'src/conteudo/sintetico';
const ATRIBUTOS =
  'docs/** filter=git-crypt diff=git-crypt\n' +
  'src/conteudo/** filter=git-crypt diff=git-crypt\n' +
  'novo/** filter=git-crypt diff=git-crypt\n' +
  '.gitattributes !filter !diff\n';
const RESUMO_LIMPO = 'Texto sintetico sem travessao.\n';

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

/**
 * Fixture com git-crypt destravado. Por padrão há um resumo limpo em src/conteudo
 * (para o piso de varredura ter o que analisar); `arquivos` acrescenta ou troca.
 */
function fixture(arquivos: Record<string, string>, atributos: string = ATRIBUTOS): string {
  const raiz = mkdtempSync(join(tmpdir(), 'portao-travessao-'));
  temporarios.push(raiz);
  git(raiz, ['init', '-q', '.']);
  execFileSync('git-crypt', ['init'], { cwd: raiz, stdio: 'ignore' });
  const todos: Record<string, string> = {
    [`${SINTETICO}/resumo.ts`]: RESUMO_LIMPO,
    ...arquivos,
    '.gitattributes': atributos
  };
  for (const [caminho, conteudo] of Object.entries(todos)) {
    mkdirSync(dirname(join(raiz, caminho)), { recursive: true });
    writeFileSync(join(raiz, caminho), conteudo);
  }
  git(raiz, ['add', ...Object.keys(todos)]);
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
  it('cifrados que varrem sem travessão e travessão só dentro de "blocos" do texto integral: sai 0', () => {
    const raiz = fixture({
      [`${SINTETICO}/textoIntegral.ts`]: TEXTO_INTEGRAL_COM_BLOCO('sem', EM)
    });
    const { rc, saida } = rodar(raiz);
    expect(rc, saida).toBe(0);
    expect(saida).toMatch(/encontrados=0 analisados=\d+ falharam=0 sem_classe=0/);
  });

  it('U+2014 em arquivo interno (docs/, não varre): sai 0 (caso novo)', () => {
    const raiz = fixture({ 'docs/nota.md': `Texto com ${EM} interno.\n` });
    const { rc, saida } = rodar(raiz);
    expect(rc, saida).toBe(0);
    expect(saida).toMatch(/encontrados=0/);
  });
});

describe('verificar-travessao-arvore: sabotagens vermelhas (L-36)', () => {
  it('U+2014 em arquivo cifrado que varre (src/conteudo): sai 1 e aponta o arquivo', () => {
    const raiz = fixture({ [`${SINTETICO}/resumo.ts`]: `Texto com ${EM} plantado.\n` });
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toContain(`${SINTETICO}/resumo.ts`);
  });

  it('U+2013 (en-dash) em arquivo cifrado que varre: sai 1', () => {
    const raiz = fixture({ [`${SINTETICO}/resumo.ts`]: `Texto com ${EN} plantado.\n` });
    const { rc } = rodar(raiz);
    expect(rc).toBe(1);
  });

  it('travessão no título do texto integral, fora de "blocos": sai 1 (a isenção não cobre o título)', () => {
    const raiz = fixture({
      [`${SINTETICO}/textoIntegral.ts`]: TEXTO_INTEGRAL_COM_BLOCO(EM, 'sem')
    });
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toContain(`${SINTETICO}/textoIntegral.ts`);
  });

  it('caminho cifrado sem classe (novo/x.md): sai 1 e cita o caminho (falha fechada)', () => {
    const raiz = fixture({ 'novo/x.md': 'texto sintetico sem travessao.\n' });
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toContain('novo/x.md');
  });

  it('piso: nenhum arquivo que varre é varredura quebrada, sai 1', () => {
    const raiz = fixture({}, '.gitattributes !filter !diff\n');
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toMatch(/analisados=0/);
  });
});
