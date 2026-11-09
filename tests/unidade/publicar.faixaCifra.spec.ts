import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/apoio/cifra-faixa.py (LU-F4.3, revisão de segurança). A prova de cifra do envio percorre
 * cada commit da faixa que vai ao remoto, não só a ponta: um commit do meio com arquivo cifrado em
 * claro, depois corrigido na ponta, iria ao GitHub mesmo com a ponta limpa. Cada blob alterado é
 * conferido pelo .gitattributes DAQUELE commit. Sabotagem: commit intermediário em claro entre dois
 * cifrados, com a ponta cifrada, tem de reprovar.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = join(RAIZ, 'scripts/apoio/cifra-faixa.py');

const MAGIA = Buffer.from([0x00, 0x47, 0x49, 0x54, 0x43, 0x52, 0x59, 0x50, 0x54, 0x00]);
const CIFRADO = Buffer.concat([MAGIA, Buffer.from('corpo cifrado sintetico\n')]);

/** Bytes pseudoaleatórios e determinísticos (hash em cadeia, semente por índice): imitam a carga cifrada. */
function cargaAleatoria(semente: number, n: number): Buffer {
  const partes: Buffer[] = [];
  let estado = Buffer.from(`semente-f2-${semente}`);
  let total = 0;
  while (total < n) {
    estado = createHash('sha256').update(estado).digest();
    partes.push(estado);
    total += estado.length;
  }
  return Buffer.concat(partes).subarray(0, n);
}
const ATRIBUTOS =
  [
    'src/conteudo/** filter=git-crypt diff=git-crypt',
    'docs/** filter=git-crypt diff=git-crypt',
    'tests/caracterizacao/*.esperado.json filter=git-crypt diff=git-crypt',
    'TODO.md filter=git-crypt diff=git-crypt',
    '.gitattributes !filter !diff'
  ].join('\n') + '\n';

let tmp: string;
let repo: string;

function git(args: string[]): string {
  const r = spawnSync(
    'git',
    [
      '-C',
      repo,
      '-c',
      'user.name=teste',
      '-c',
      'user.email=teste@example.com',
      '-c',
      'commit.gpgSign=false',
      ...args
    ],
    { encoding: 'utf-8' }
  );
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

/** Grava arquivos e faz um commit. `arquivos` mapeia caminho → conteúdo (Buffer ou string). */
function commit(arquivos: Record<string, Buffer | string>, msg: string): string {
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    const alvo = join(repo, caminho);
    mkdirSync(dirname(alvo), { recursive: true });
    writeFileSync(alvo, conteudo);
  }
  git(['add', '-A']);
  git(['commit', '-q', '-m', msg]);
  return git(['rev-parse', 'HEAD']);
}

/** Bytes do blob de um caminho num commit (sem filtro). */
function blob(rev: string, caminho: string): Buffer {
  const r = spawnSync('git', ['-C', repo, 'show', `${rev}:${caminho}`], { encoding: null });
  if (r.status !== 0) throw new Error(`git show ${rev}:${caminho}`);
  return r.stdout;
}

function checar(base: string, tip: string): { status: number | null; saida: string } {
  const r = spawnSync('python3', [SCRIPT, repo, base, tip], { encoding: 'utf-8' });
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-faixa-'));
  repo = join(tmp, 'repo');
  spawnSync('git', ['init', '-q', '-b', 'main', repo]);
  // A base já tem um cifrado: a ponta de cada teste tem caminho cifrado (piso da ponta).
  commit({ '.gitattributes': ATRIBUTOS, 'README.md': 'base\n', 'docs/base.md': CIFRADO }, 'base');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('prova de cifra da faixa de envio (LU-F4.3, revisão de segurança)', () => {
  it('faixa só com blobs cifrados passa, com encontrados = analisados e falharam=0', () => {
    const base = git(['rev-parse', 'HEAD']);
    commit({ 'docs/a.md': CIFRADO }, 'um');
    const tip = commit({ 'src/conteudo/b.ts': CIFRADO }, 'dois');
    const r = checar(base, tip);
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toMatch(/encontrados=3 analisados=3 falharam=0/);
  });

  it('SABOTAGEM: commit do meio em claro entre dois cifrados, com a ponta cifrada, reprova', () => {
    const base = git(['rev-parse', 'HEAD']);
    commit({ 'docs/a.md': CIFRADO }, 'um cifrado');
    const meio = commit({ 'docs/a.md': 'texto em claro no meio\n' }, 'dois em claro');
    const tip = commit({ 'docs/a.md': CIFRADO }, 'tres cifrado de novo');
    // A ponta está limpa: a checagem só da árvore final deixaria passar.
    expect(blob(tip, 'docs/a.md').subarray(0, 10).equals(MAGIA)).toBe(true);
    const r = checar(base, tip);
    expect(r.status, r.saida).toBe(1);
    expect(r.saida).toContain(`EM CLARO: ${meio.slice(0, 12)} docs/a.md`);
    expect(r.saida).toMatch(/falharam=1/);
  });

  it('a ponta em claro reprova (caminho cifrado por padrão de diretório)', () => {
    const base = git(['rev-parse', 'HEAD']);
    const tip = commit({ 'src/conteudo/c.ts': 'em claro\n' }, 'claro');
    const r = checar(base, tip);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('EM CLARO');
    expect(r.saida).toContain('src/conteudo/c.ts');
  });

  it('padrões de arquivo: TODO.md na raiz e *.esperado.json dentro de pasta são cifrados; .txt na mesma pasta não', () => {
    const base = git(['rev-parse', 'HEAD']);
    const tip = commit(
      {
        'TODO.md': 'claro\n',
        'tests/caracterizacao/a.esperado.json': 'claro\n',
        'tests/caracterizacao/a.txt': 'publico\n'
      },
      'padroes'
    );
    const r = checar(base, tip);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('TODO.md');
    expect(r.saida).toContain('tests/caracterizacao/a.esperado.json');
    expect(r.saida).not.toContain('tests/caracterizacao/a.txt');
  });

  it('caminho sem atributo de cifra não é conferido: texto público em claro passa', () => {
    const base = git(['rev-parse', 'HEAD']);
    const tip = commit({ 'publico/x.md': 'aberto\n' }, 'publico');
    const r = checar(base, tip);
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).not.toContain('publico/x.md');
  });

  it('F2: 200 cifrados com carga pseudoaleatória (cota DESVIOS) passam, sem falso positivo', () => {
    const base = git(['rev-parse', 'HEAD']);
    const arquivos: Record<string, Buffer> = {};
    for (let i = 0; i < 200; i += 1) {
      const nome = `docs/aleatorio-${String(i).padStart(3, '0')}.md`;
      arquivos[nome] = Buffer.concat([MAGIA, cargaAleatoria(i, 12), cargaAleatoria(1000 + i, 300)]);
    }
    const tip = commit(arquivos, 'duzentos cifrados de carga aleatoria');
    const r = checar(base, tip);
    expect(r.status, r.saida).toBe(0);
    // 201 = 200 da faixa + docs/base.md: cifra-faixa.py confere a árvore inteira de cada commit (por desenho).
    expect(r.saida).toMatch(/encontrados=201 analisados=201 falharam=0/);
  });

  it('zero caminho cifrado na ponta é varredura quebrada: reprova', () => {
    repo = join(tmp, 'sem-cifra');
    spawnSync('git', ['init', '-q', '-b', 'main', repo]);
    // .gitattributes presente, sem nenhuma regra de cifra: zero caminho protegido, não 'sem .gitattributes'.
    const base = commit(
      { '.gitattributes': '# sem cifra\n', 'README.md': 'x\n' },
      'base sem cifra'
    );
    const tip = commit({ 'README.md': 'y\n' }, 'sem cifra');
    const r = checar(base, tip);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('varredura quebrada');
  });
});

/**
 * conferir_refs_antes_do_envio (LU-F4.3, revisão de segurança): o envio manda o SHA validado, e antes
 * disso main e a tag local têm de apontar para o commit de release. Sabotagem: main em outro commit.
 */
describe('refs antes do envio: main e a tag apontam para o commit de release', () => {
  function funcaoPublicar(nome: string): string {
    const fonte = readFileSync(join(RAIZ, 'scripts/publicar.sh'), 'utf-8');
    const m = fonte.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
    if (!m) throw new Error(`função ${nome} não encontrada em publicar.sh`);
    return m[0];
  }

  function refsCom(mainAponta: 'release' | 'outro', tagAponta: 'release' | 'outro') {
    const dir = join(tmp, 'refs-repo');
    spawnSync('git', ['init', '-q', '-b', 'main', dir]);
    const run = (args: string[]) =>
      spawnSync(
        'git',
        [
          '-C',
          dir,
          '-c',
          'user.name=t',
          '-c',
          'user.email=t@example.com',
          '-c',
          'commit.gpgSign=false',
          ...args
        ],
        { encoding: 'utf-8' }
      );
    run(['commit', '--allow-empty', '-q', '-m', 'um']);
    const outro = run(['rev-parse', 'HEAD']).stdout.trim();
    run(['commit', '--allow-empty', '-q', '-m', 'release']);
    const release = run(['rev-parse', 'HEAD']).stdout.trim();
    if (mainAponta === 'outro') run(['update-ref', 'refs/heads/main', outro]);
    run(['tag', '-a', 'v9.9.9.9', '-m', 'v', tagAponta === 'release' ? release : outro]);
    const script = [
      'set -euo pipefail',
      funcaoPublicar('recusar'),
      funcaoPublicar('conferir_refs_antes_do_envio'),
      `BRANCH_PUBLICA=main`,
      `VERSAO_NOVA=9.9.9.9`,
      `SHA_RELEASE=${release}`,
      `cd '${dir}'`,
      'conferir_refs_antes_do_envio',
      'echo passou'
    ].join('\n');
    const r = spawnSync('bash', ['-c', script], { encoding: 'utf-8' });
    return { status: r.status, saida: `${r.stdout}${r.stderr}` };
  }

  it('main e tag no commit de release passam', () => {
    const r = refsCom('release', 'release');
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('passou');
  });

  it('SABOTAGEM: main em outro commit reprova antes de qualquer envio', () => {
    const r = refsCom('outro', 'release');
    expect(r.status).toBe(1);
    expect(r.saida).toContain('não para o commit de release');
    expect(r.saida).not.toContain('passou');
  });

  it('SABOTAGEM: tag em outro commit reprova', () => {
    const r = refsCom('release', 'outro');
    expect(r.status).toBe(1);
    expect(r.saida).toContain('refs/tags/v9.9.9.9');
  });
});

/**
 * Revisão automática de segurança (LU-F4.3): regra do git da fonte certa (check-attr --source), merge,
 * nome com espaço, acento e aspas, regra removida no meio e restaurada na ponta, .gitattributes
 * aninhado contrário, commit sem .gitattributes e faixa vazia. Todos têm de reprovar.
 */
describe('faixa: casos da revisão (merge, nomes, regra no meio, aninhado)', () => {
  const CIFRADO_B = Buffer.concat([MAGIA, Buffer.from('versao do lado\n')]);
  const CIFRADO_C = Buffer.concat([MAGIA, Buffer.from('versao principal\n')]);

  it('merge com resolução em claro reprova (a árvore do merge é inspecionada)', () => {
    const base = git(['rev-parse', 'HEAD']);
    git(['checkout', '-q', '-b', 'lado']);
    commit({ 'docs/x.md': CIFRADO_B }, 'lado');
    git(['checkout', '-q', 'main']);
    commit({ 'docs/x.md': CIFRADO_C }, 'principal');
    spawnSync('git', [
      '-C',
      repo,
      '-c',
      'user.name=teste',
      '-c',
      'user.email=teste@example.com',
      'merge',
      '-q',
      '--no-edit',
      'lado'
    ]);
    writeFileSync(join(repo, 'docs/x.md'), 'resolvido em claro\n');
    git(['add', '-A']);
    git(['commit', '-q', '--no-edit']);
    const tip = git(['rev-parse', 'HEAD']);
    const r = checar(base, tip);
    expect(r.status, r.saida).toBe(1);
    expect(r.saida).toContain(`EM CLARO: ${tip.slice(0, 12)} docs/x.md`);
  });

  it('caminho com espaço, acento e aspas é conferido e aparece íntegro na falha', () => {
    const base = git(['rev-parse', 'HEAD']);
    const tip = commit({ 'docs/nota "é" x.md': 'claro\n' }, 'nome estranho');
    const r = checar(base, tip);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('EM CLARO');
    expect(r.saida).toContain('docs/nota "é" x.md');
  });

  it('regra removida no meio e restaurada na ponta: o blob em claro do meio reprova', () => {
    const base = git(['rev-parse', 'HEAD']);
    const meio = commit(
      { '.gitattributes': 'TODO.md filter=git-crypt\n', 'docs/a.md': 'claro\n' },
      'sem regra de docs'
    );
    const tip = commit({ '.gitattributes': ATRIBUTOS, 'docs/a.md': CIFRADO }, 'regra de volta');
    const r = checar(base, tip);
    expect(r.status, r.saida).toBe(1);
    expect(r.saida).toContain(`EM CLARO: ${meio.slice(0, 12)} docs/a.md`);
  });

  it('.gitattributes aninhado que desliga a cifra de um caminho já protegido reprova', () => {
    const base = git(['rev-parse', 'HEAD']);
    const tip = commit(
      { 'docs/sub/.gitattributes': '*.md !filter\n', 'docs/sub/a.md': 'claro\n' },
      'aninhado contrario'
    );
    const r = checar(base, tip);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('docs/sub/a.md');
  });

  it('commit da faixa sem .gitattributes reprova', () => {
    const base = git(['rev-parse', 'HEAD']);
    git(['rm', '-q', '.gitattributes']);
    const tip = commit({ 'docs/b.md': CIFRADO }, 'sem atributos');
    const r = checar(base, tip);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('sem .gitattributes');
  });

  it('faixa vazia (zero commits a enviar) é dita com clareza e recusada', () => {
    const tip = git(['rev-parse', 'HEAD']);
    const r = checar(tip, tip);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('faixa vazia');
  });
});

/**
 * I-5 (LU-F5.2, revisão de segurança): a magia de 10 bytes não basta. O cabeçalho do git-crypt tem
 * magia e nonce (22 bytes); o corpo depois dele é cifra, e cifra tem fração imprimível perto do acaso
 * (0,383 medido em 192 blobs reais; 0,347 a 0,427). Texto em claro depois da magia tem de reprovar.
 * Carga menor que 32 bytes não se mede: é contada em curtos e não reprova (limite declarado).
 */
function pseudoAleatorio(n: number): Buffer {
  const partes: Buffer[] = [];
  let estado = Buffer.from('semente-sintetica');
  while (Buffer.concat(partes).length < n) {
    estado = createHash('sha256').update(estado).digest();
    partes.push(estado);
  }
  return Buffer.concat(partes).subarray(0, n);
}

describe('I-5: magia seguida de texto em claro reprova (LU-F5.2)', () => {
  const NONCE = pseudoAleatorio(12);
  const CARGA_CIFRADA = Buffer.concat([MAGIA, NONCE, pseudoAleatorio(200)]);
  const CLARO_DEPOIS_DA_MAGIA = Buffer.concat([
    MAGIA,
    NONCE,
    Buffer.from(
      'texto de estudo em claro depois da magia, sintetico, com mais de trinta e dois bytes\n'
    )
  ]);

  it('blob só com a magia (10 bytes, sem nonce) reprova: cabeçalho incompleto', () => {
    const base = git(['rev-parse', 'HEAD']);
    const tip = commit({ 'docs/a.md': MAGIA }, 'so magia');
    const r = checar(base, tip);
    expect(r.status, r.saida).toBe(1);
    expect(r.saida).toContain('cabeçalho incompleto');
  });

  it('magia seguida de texto em claro (60 bytes) reprova e nomeia a carga em claro', () => {
    const base = git(['rev-parse', 'HEAD']);
    const tip = commit({ 'docs/a.md': CLARO_DEPOIS_DA_MAGIA }, 'magia e claro');
    const r = checar(base, tip);
    expect(r.status, r.saida).toBe(1);
    expect(r.saida).toContain(`EM CLARO: ${tip.slice(0, 12)} docs/a.md`);
    expect(r.saida).toContain('carga em claro');
    expect(r.saida).not.toContain('texto de estudo em claro');
  });

  it('magia com carga de bytes cifrados (200 bytes) passa sem reprovar', () => {
    const base = git(['rev-parse', 'HEAD']);
    const tip = commit({ 'docs/a.md': CARGA_CIFRADA }, 'cifra de verdade');
    const r = checar(base, tip);
    expect(r.status, r.saida).toBe(0);
    // curtos=1: só o blob-base da fixture (carga de 12 bytes), que também está na árvore da faixa.
    expect(r.saida).toMatch(/curtos=1/);
  });

  it('carga curta (10 bytes depois do nonce) não reprova e aparece em curtos=2', () => {
    const base = git(['rev-parse', 'HEAD']);
    const tip = commit(
      { 'docs/a.md': Buffer.concat([MAGIA, NONCE, Buffer.from('dez bytes!')]) },
      'curta'
    );
    const r = checar(base, tip);
    expect(r.status, r.saida).toBe(0);
    // curtos=2: o blob-base da fixture (12 bytes) e este (10 bytes).
    expect(r.saida).toMatch(/curtos=2/);
  });
});
