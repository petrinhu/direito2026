import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/apoio/textoEmClaroNaFaixa.ts (LU-F5.2, revisão F5.2, I-4). A prova de cifra da faixa
 * (cifra-faixa.py) só olha caminhos protegidos. Este portão olha TODO blob que a faixa introduz,
 * em qualquer caminho, e reprova se ele contém janela de 40 caracteres do texto de estudo que está
 * cifrado na árvore da ponta. Sabotagem central: texto copiado para caminho sem filtro num commit do
 * meio e removido depois. Os dados são sintéticos, e o relatório nunca imprime trecho de conteúdo.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = join(RAIZ, 'scripts/apoio/textoEmClaroNaFaixa.ts');

const MAGIA = Buffer.from([0x00, 0x47, 0x49, 0x54, 0x43, 0x52, 0x59, 0x50, 0x54, 0x00]);
const CAMINHO_FONTE = 'src/conteudo/p1/cad/u1/resumo.ts';
const TRECHO_ESTUDO =
  'A cadeira estuda a função social da propriedade urbana e seus limites legais na prática.';
const FRASE_PERMITIDA = 'Procure a legislação aplicável a cada fato.';
const FONTE_EM_CLARO = [
  `export const r = ['<p>${TRECHO_ESTUDO}</p>'];`,
  `export const dica = '${FRASE_PERMITIDA}';`,
  ''
].join('\n');
const ATRIBUTOS = 'src/conteudo/** filter=git-crypt diff=git-crypt\n.gitattributes !filter !diff\n';

/** Bytes pseudoaleatórios e determinísticos (hash em cadeia): imitam a cifra, sem depender de sorteio. */
function pseudoAleatorio(n: number): Buffer {
  const partes: Buffer[] = [];
  let estado = Buffer.from('semente-sintetica-faixa');
  while (Buffer.concat(partes).length < n) {
    estado = createHash('sha256').update(estado).digest();
    partes.push(estado);
  }
  return Buffer.concat(partes).subarray(0, n);
}
const CIFRADO = Buffer.concat([MAGIA, pseudoAleatorio(12), pseudoAleatorio(200)]);

let tmp: string;
let repo: string;
let semHooks: string;

/** Hooks do ambiente não entram nas fixtures: core.hooksPath aponta para pasta vazia (L-45, sinal herdado). */
function git(args: string[]): string {
  const r = spawnSync(
    'git',
    [
      '-C',
      repo,
      '-c',
      `core.hooksPath=${semHooks}`,
      '-c',
      'user.name=teste',
      '-c',
      'user.email=teste@exemplo.invalido',
      '-c',
      'commit.gpgSign=false',
      ...args
    ],
    { encoding: 'utf-8' }
  );
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

/** Grava os arquivos e commita SÓ eles (a fonte em claro na árvore nunca entra no commit). */
function commit(arquivos: Record<string, Buffer | string>, msg: string): string {
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    const alvo = join(repo, caminho);
    mkdirSync(dirname(alvo), { recursive: true });
    writeFileSync(alvo, conteudo);
    git(['add', '--', caminho]);
  }
  git(['commit', '-q', '-m', msg]);
  return git(['rev-parse', 'HEAD']);
}

/** Remove um arquivo num commit. */
function apagar(caminho: string, msg: string): string {
  git(['rm', '-q', '--', caminho]);
  git(['commit', '-q', '-m', msg]);
  return git(['rev-parse', 'HEAD']);
}

/**
 * Repositório com a fonte cifrada no commit e em claro na árvore destrancada, como na publicação.
 * `base` e a ponta vêm do commit inicial; a faixa é o que cada teste acrescenta.
 */
function repositorio(): string {
  git(['init', '-q', '-b', 'main']);
  commit({ '.gitattributes': ATRIBUTOS, 'README.md': 'base\n', [CAMINHO_FONTE]: CIFRADO }, 'base');
  writeFileSync(join(repo, CAMINHO_FONTE), FONTE_EM_CLARO);
  return git(['rev-parse', 'HEAD']);
}

function checar(base: string, ponta: string): { status: number | null; saida: string } {
  const r = spawnSync('node', ['--import', 'tsx', SCRIPT, repo, base, ponta], {
    cwd: RAIZ,
    encoding: 'utf-8'
  });
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-texto-faixa-'));
  repo = join(tmp, 'repo');
  semHooks = join(tmp, 'sem-hooks');
  mkdirSync(repo, { recursive: true });
  mkdirSync(semHooks, { recursive: true });
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('I-4: texto de estudo em claro na faixa, em qualquer caminho (LU-F5.2)', () => {
  it('faixa só com cifra e nenhum texto em claro passa, com encontrados = analisados e falharam=0', () => {
    const base = repositorio();
    commit({ 'docs/x.md': CIFRADO }, 'cifrado');
    const ponta = commit({ 'docs/y.md': CIFRADO }, 'outro cifrado');
    const r = checar(base, ponta);
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toMatch(/encontrados=(\d+) analisados=\1 falharam=0/);
  });

  it('SABOTAGEM: texto copiado para caminho sem filtro num commit do meio e removido depois reprova', () => {
    const base = repositorio();
    const meio = commit({ 'notas/copia.md': `${TRECHO_ESTUDO}\n` }, 'copia no meio');
    const ponta = apagar('notas/copia.md', 'remove a copia');
    const r = checar(base, ponta);
    expect(r.status, r.saida).toBe(1);
    expect(r.saida).toContain(`TEXTO DE ESTUDO EM CLARO: ${meio.slice(0, 12)} notas/copia.md`);
    expect(r.saida).toMatch(/falharam=1/);
    // O relatório só traz caminho, commit e contagem: nenhum trecho do texto.
    expect(r.saida).not.toContain(TRECHO_ESTUDO);
  });

  it('a mesma cópia em maiúsculas e sem acento também reprova (critério de normalização)', () => {
    const base = repositorio();
    const sem =
      'A CADEIRA ESTUDA A FUNCAO SOCIAL DA PROPRIEDADE URBANA E SEUS LIMITES LEGAIS NA PRATICA.';
    const meio = commit({ 'notas/caixa.txt': `${sem}\n` }, 'copia em caixa alta');
    const r = checar(base, meio);
    expect(r.status, r.saida).toBe(1);
    expect(r.saida).toContain(`TEXTO DE ESTUDO EM CLARO: ${meio.slice(0, 12)} notas/caixa.txt`);
  });

  it('frase permitida copiada não reprova (exceção por frase, L-18 e E6)', () => {
    const base = repositorio();
    const ponta = commit({ 'notas/frase.md': `${FRASE_PERMITIDA}\n` }, 'frase de interface');
    const r = checar(base, ponta);
    expect(r.status, r.saida).toBe(0);
  });

  it('árvore trancada (fonte com a magia na árvore) reprova com mensagem clara, sem verde falso', () => {
    const base = repositorio();
    writeFileSync(join(repo, CAMINHO_FONTE), CIFRADO);
    const ponta = commit({ 'docs/y.md': 'x\n' }, 'depois de trancar');
    const r = checar(base, ponta);
    expect(r.status, r.saida).toBe(1);
    expect(r.saida).toContain('árvore trancada');
  });

  it('zero fonte cifrada é varredura quebrada e reprova', () => {
    repo = join(tmp, 'sem-fonte');
    mkdirSync(repo, { recursive: true });
    git(['init', '-q', '-b', 'main']);
    const base = commit(
      { '.gitattributes': '# sem cifra\n', 'README.md': 'x\n' },
      'base sem fonte'
    );
    const ponta = commit({ 'notas/a.md': 'algo\n' }, 'sem fonte');
    const r = checar(base, ponta);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('zero fonte');
  });

  it('faixa vazia é dita com clareza e recusada', () => {
    const base = repositorio();
    const r = checar(base, base);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('faixa vazia');
  });
});
