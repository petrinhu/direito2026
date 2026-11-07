import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Ligação da prova de texto de estudo na faixa ao portão do publicar (scripts/publicar.sh,
 * conferir_cifra_da_faixa; LU-F5.2, I-4). Roda a função real, extraída do script, num repositório
 * sintético descartável. Sabotagem da ligação: sem a chamada, a faixa com cópia de texto passa. Isso
 * prova que o teste é sensível à ligação, e não só ao script (L-36, L-27). Dados sintéticos.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FONTE_PUBLICAR = readFileSync(join(RAIZ, 'scripts/publicar.sh'), 'utf-8');
const MAGIA = Buffer.from([0x00, 0x47, 0x49, 0x54, 0x43, 0x52, 0x59, 0x50, 0x54, 0x00]);
const CAMINHO_FONTE = 'src/conteudo/p1/cad/u1/resumo.ts';
const TRECHO_ESTUDO =
  'A cadeira estuda a função social da propriedade urbana e seus limites legais na prática.';
const ATRIBUTOS = 'src/conteudo/** filter=git-crypt diff=git-crypt\n.gitattributes !filter !diff\n';
const CIFRADO = Buffer.concat([
  MAGIA,
  Buffer.from('0123456789ab', 'utf-8'),
  Buffer.alloc(200, 0x9f)
]);

let tmp: string;
let repo: string;
let semHooks: string;

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

function commit(arquivos: Record<string, Buffer | string>, msg: string): string {
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    const alvo = join(repo, caminho);
    mkdirSync(join(alvo, '..'), { recursive: true });
    writeFileSync(alvo, conteudo);
    git(['add', '--', caminho]);
  }
  git(['commit', '-q', '-m', msg]);
  return git(['rev-parse', 'HEAD']);
}

/** Corpo de uma função de publicar.sh, do início ao fechamento na coluna zero. */
function funcao(nome: string): string {
  const m = FONTE_PUBLICAR.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  if (!m) throw new Error(`função ${nome} não encontrada em publicar.sh`);
  return m[0];
}

/**
 * Texto da conferência com a ligação removida (sabotagem). Exige que cada linha removida exista, senão
 * a sabotagem não chegou e o teste seria falso.
 */
function conferenciaSemLigacao(): string {
  let texto = funcao('conferir_cifra_da_faixa');
  const trocas: [RegExp, string][] = [
    [/^ {2}\(cd "\$RAIZ" && node --import tsx scripts\/apoio\/textoEmClaroNaFaixa\.ts.*$/m, '  :'],
    [/^ {2}cat "\$saida_texto"$/m, '  :'],
    [/^ {2}\[ "\$rc_texto" -eq 0 \] \|\| recusar .*$/m, '  :']
  ];
  for (const [padrao, troca] of trocas) {
    if (!padrao.test(texto)) throw new Error(`sabotagem não chegou: ${padrao}`);
    texto = texto.replace(padrao, troca);
  }
  return texto;
}

/** Roda conferir_cifra_da_faixa (ou a versão sabotada) como o publicar faria, sem remoto: a faixa é o histórico. */
function conferir(texto: string, ponta: string): { status: number | null; saida: string } {
  const espaco = mkdtempSync(join(tmp, 'espaco-'));
  const script = [
    'set -euo pipefail',
    funcao('recusar'),
    texto,
    'ler_main_remota() { :; }',
    `RAIZ='${repo}'`,
    `ESPACO='${espaco}'`,
    'REMOTO=origem',
    `SHA_RELEASE=${ponta}`,
    'conferir_cifra_da_faixa',
    'echo passou'
  ].join('\n');
  const r = spawnSync('bash', ['-c', script], { encoding: 'utf-8' });
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-ligacao-texto-'));
  repo = join(tmp, 'repo');
  semHooks = join(tmp, 'sem-hooks');
  mkdirSync(repo, { recursive: true });
  mkdirSync(semHooks, { recursive: true });
  git(['init', '-q', '-b', 'main']);
  // scripts/ e node_modules/ da raiz real, por link: o portão roda o código de verdade, sem cópia.
  symlinkSync(join(RAIZ, 'scripts'), join(repo, 'scripts'), 'dir');
  symlinkSync(join(RAIZ, 'node_modules'), join(repo, 'node_modules'), 'dir');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('publicar: a prova de texto na faixa está ligada ao portão (LU-F5.2, I-4)', () => {
  it('faixa só com cifra passa e a conferência diz que conferiu o texto na faixa', () => {
    commit(
      { '.gitattributes': ATRIBUTOS, 'README.md': 'base\n', [CAMINHO_FONTE]: CIFRADO },
      'base'
    );
    // Árvore destrancada, como na publicação: a fonte está em claro na árvore de trabalho.
    writeFileSync(join(repo, CAMINHO_FONTE), `export const r = ['<p>${TRECHO_ESTUDO}</p>'];\n`);
    const ponta = commit({ 'docs/x.md': CIFRADO }, 'so cifra');
    const r = conferir(funcao('conferir_cifra_da_faixa'), ponta);
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('texto de estudo na faixa conferiu');
  });

  it('SABOTAGEM DO ENVIO: cópia de texto de estudo que some depois reprova antes do push', () => {
    commit(
      { '.gitattributes': ATRIBUTOS, 'README.md': 'base\n', [CAMINHO_FONTE]: CIFRADO },
      'base'
    );
    writeFileSync(join(repo, CAMINHO_FONTE), `export const r = ['<p>${TRECHO_ESTUDO}</p>'];\n`);
    commit({ 'notas/copia.md': `${TRECHO_ESTUDO}\n` }, 'copia no meio');
    git(['rm', '-q', '--', 'notas/copia.md']);
    git(['commit', '-q', '-m', 'remove a copia']);
    const ponta = git(['rev-parse', 'HEAD']);
    const r = conferir(funcao('conferir_cifra_da_faixa'), ponta);
    expect(r.status, r.saida).toBe(1);
    expect(r.saida).toContain('prova de texto de estudo na faixa reprovou');
    expect(r.saida).toContain('nada foi enviado ao git');
    expect(r.saida).not.toContain('passou');
  });

  it('SABOTAGEM DA LIGAÇÃO: sem a chamada, a mesma faixa passaria (o teste acima é sensível à ligação)', () => {
    commit(
      { '.gitattributes': ATRIBUTOS, 'README.md': 'base\n', [CAMINHO_FONTE]: CIFRADO },
      'base'
    );
    writeFileSync(join(repo, CAMINHO_FONTE), `export const r = ['<p>${TRECHO_ESTUDO}</p>'];\n`);
    commit({ 'notas/copia.md': `${TRECHO_ESTUDO}\n` }, 'copia no meio');
    git(['rm', '-q', '--', 'notas/copia.md']);
    git(['commit', '-q', '-m', 'remove a copia']);
    const ponta = git(['rev-parse', 'HEAD']);
    const r = conferir(conferenciaSemLigacao(), ponta);
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('passou');
  });
});
