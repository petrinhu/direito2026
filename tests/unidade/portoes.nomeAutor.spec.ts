import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Trava do nome do titular (scripts/verificar-nome-autor.ts, SB-F7). Cada caso monta uma árvore,
 * um pacote ou uma resposta sintéticos em pasta temporária. O titular é SINTÉTICO (nenhum nome
 * real entra neste arquivo nem nos resultados), e a fonte dele é apontada por
 * VERIFICAR_TITULAR_ARQUIVO. Os casos de sabotagem vêm antes da prova de que a trava passa.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// NOME_AUTOR_SCRIPT só existe para a sabotagem (L-27): aponta o spec para uma cópia do script fora da árvore.
const SCRIPT = process.env.NOME_AUTOR_SCRIPT ?? join(RAIZ, 'scripts/verificar-nome-autor.ts');
const TITULAR_SINTETICO = 'Ana Exposta Açucena';
const FONTE_REL = 'src/conteudo/sobre/autoria.ts';
const CABECALHO_CIFRA = Buffer.from('\0GITCRYPT\0');

let tmp: string;
const fontesTemporarias: string[] = [];

function fonteSintetica(): string {
  const dir = mkdtempSync(join(tmpdir(), 'trava-nome-fonte-'));
  fontesTemporarias.push(dir);
  const caminho = join(dir, 'fonte.ts');
  writeFileSync(caminho, `export const TITULAR = '${TITULAR_SINTETICO}';\n`);
  return caminho;
}

function criarFonte(raiz: string, conteudo?: Buffer | string): string {
  const caminho = join(raiz, FONTE_REL);
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, conteudo ?? `export const TITULAR = '${TITULAR_SINTETICO}';\n`);
  return caminho;
}

function repo(arquivos: Record<string, string | Buffer>): string {
  const raiz = mkdtempSync(join(tmpdir(), 'trava-nome-'));
  tmp = raiz;
  spawnSync('git', ['-C', raiz, 'init', '-q']);
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    const caminho = join(raiz, rel);
    mkdirSync(dirname(caminho), { recursive: true });
    writeFileSync(caminho, conteudo);
  }
  spawnSync('git', ['-C', raiz, 'add', '-A']);
  return raiz;
}

function rodar(args: string[], env: Record<string, string>) {
  const r = spawnSync(process.execPath, ['--import', 'tsx', SCRIPT, ...args], {
    encoding: 'utf-8',
    env: { ...process.env, ...env }
  });
  const saida = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  // A trava nunca imprime o nome (L-28): prova em todo caso.
  expect(saida).not.toContain(TITULAR_SINTETICO);
  // Todo caso exige a linha de resumo do próprio script: sem ela, o status 1 do node ausente não conta.
  expect(r.stdout ?? '').toMatch(
    /verificar-nome-autor: encontrados=\d+ analisados=\d+ falharam=\d+/
  );
  return { status: r.status ?? -1, saida: saida, resumo: r.stdout ?? '' };
}

describe('verificar-nome-autor: modo árvore', () => {
  afterEach(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  });

  it('(a) nome num arquivo fora da lista reprova, com o caminho e sem o nome', () => {
    const raiz = repo({ 'src/x.ts': `const nome = '${TITULAR_SINTETICO}';\n` });
    criarFonte(raiz);
    const r = rodar(['--arvore', raiz], { VERIFICAR_TITULAR_ARQUIVO: join(raiz, FONTE_REL) });
    expect(r.status).toBe(1);
    expect(r.saida).toContain('src/x.ts');
    expect(r.saida).toContain('falharam=1');
  });

  it('(b) nome só na fonte permitida passa', () => {
    const raiz = repo({});
    criarFonte(raiz);
    spawnSync('git', ['-C', raiz, 'add', '-A']);
    const r = rodar(['--arvore', raiz], { VERIFICAR_TITULAR_ARQUIVO: join(raiz, FONTE_REL) });
    expect(r.status).toBe(0);
    expect(r.saida).toContain('encontrados=1 analisados=1 falharam=0');
  });

  it('(c) caixa, acento trocado e espaço duplo fora da lista também reprovam', () => {
    const raiz = repo({ 'docs/nota.md': 'Autora: ANA  EXPOSTA ACUCENA.\n' });
    criarFonte(raiz);
    spawnSync('git', ['-C', raiz, 'add', '-A']);
    const r = rodar(['--arvore', raiz], { VERIFICAR_TITULAR_ARQUIVO: join(raiz, FONTE_REL) });
    expect(r.status).toBe(1);
    expect(r.saida).toContain('docs/nota.md');
  });

  it('(h) árvore sem nenhum arquivo rastreado é varredura quebrada, reprova', () => {
    const raiz = repo({});
    criarFonte(raiz);
    const r = rodar(['--arvore', raiz], { VERIFICAR_TITULAR_ARQUIVO: join(raiz, FONTE_REL) });
    expect(r.status).toBe(1);
    expect(r.saida).toContain('analisados=0');
  });

  it('(g) fonte ausente reprova', () => {
    const raiz = repo({ 'src/a.ts': 'x\n' });
    const r = rodar(['--arvore', raiz], { VERIFICAR_TITULAR_ARQUIVO: join(raiz, 'nao-existe.ts') });
    expect(r.status).toBe(1);
    expect(r.saida).toContain('ausente');
  });

  it('(g) fonte cifrada reprova, porque a trava só roda com a chave destravada', () => {
    const raiz = repo({ 'src/a.ts': 'x\n' });
    const cifrada = criarFonte(raiz, Buffer.concat([CABECALHO_CIFRA, Buffer.from('ab')]));
    const r = rodar(['--arvore', raiz], { VERIFICAR_TITULAR_ARQUIVO: cifrada });
    expect(r.status).toBe(1);
    expect(r.saida).toContain('cifrada');
  });
});

describe('verificar-nome-autor: modo pacote e resposta anônima', () => {
  afterEach(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
    for (const dir of fontesTemporarias.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function pacote(arquivos: Record<string, string>): string {
    const raiz = mkdtempSync(join(tmpdir(), 'trava-nome-pac-'));
    tmp = raiz;
    for (const [rel, conteudo] of Object.entries(arquivos)) {
      mkdirSync(dirname(join(raiz, rel)), { recursive: true });
      writeFileSync(join(raiz, rel), conteudo);
    }
    return raiz;
  }

  it('(d) nome em app/index.html do pacote reprova', () => {
    const raiz = pacote({ 'app/index.html': `<p>${TITULAR_SINTETICO}</p>` });
    const fonte = fonteSintetica();
    const r = rodar(['--pacote', raiz], { VERIFICAR_TITULAR_ARQUIVO: fonte });
    expect(r.status).toBe(1);
  });

  it('(e) nome no webroot do pacote reprova', () => {
    const raiz = pacote({ 'webroot/entrada.css': `/* ${TITULAR_SINTETICO} */` });
    const fonte = fonteSintetica();
    const r = rodar(['--pacote', raiz], { VERIFICAR_TITULAR_ARQUIVO: fonte });
    expect(r.status).toBe(1);
  });

  it('o nome dentro de app/*.js é a exceção estreita e passa', () => {
    const raiz = pacote({ 'app/rodape-abc.js': `const t="${TITULAR_SINTETICO}";` });
    const fonte = fonteSintetica();
    const r = rodar(['--pacote', raiz], { VERIFICAR_TITULAR_ARQUIVO: fonte });
    expect(r.status).toBe(0);
  });

  it('(f) nome na resposta anônima do servidor reprova; sem o nome, passa', () => {
    const raiz = pacote({ 'resposta.html': `<p>${TITULAR_SINTETICO}</p>` });
    const fonte = fonteSintetica();
    expect(
      rodar(['--entrada', join(raiz, 'resposta.html')], { VERIFICAR_TITULAR_ARQUIVO: fonte }).status
    ).toBe(1);
    writeFileSync(join(raiz, 'resposta.html'), '<p>Entre com sua senha.</p>');
    expect(
      rodar(['--entrada', join(raiz, 'resposta.html')], { VERIFICAR_TITULAR_ARQUIVO: fonte }).status
    ).toBe(0);
  });
});

/**
 * Revisão de segurança (R1, 15/11): formas que o normalizador antigo deixava passar. Cada forma
 * carrega o titular sintético, escrito de um jeito que um navegador ou um interpretador de
 * JS/HTML desfaz. A trava tem de pegar todas, em arquivo de texto.
 */
const FORMAS_R1: ReadonlyArray<readonly [string, string]> = [
  ['sem espaço entre as palavras', 'AnaExpostaAcucena'],
  ['tag HTML entre as palavras', 'Ana<b></b>Exposta<i></i>Açucena'],
  ['tag com atributo no meio', 'Ana<span class="x">Exposta</span>Açucena'],
  ['largura zero U+200B', 'Ana​Exposta​Açucena'],
  ['hífen suave U+00AD', 'Ana­Exposta Açucena'],
  ['&nbsp; nomeado', 'Ana&nbsp;Exposta&nbsp;Açucena'],
  ['espaço em entidade decimal', 'Ana&#32;Exposta&#32;Açucena'],
  ['espaço em entidade hexadecimal', 'Ana&#x20;Exposta&#x20;Açucena'],
  ['letra escrita com entidade nomeada', 'Ana Exposta A&ccedil;ucena'],
  ['escape JS \\u0020', 'Ana\\u0020Exposta\\u0020Açucena'],
  ['escape JS \\x20', 'Ana\\x20Exposta\\x20Açucena'],
  ['percent-encoding', 'Ana%20Exposta%20A%C3%A7ucena']
];

/** Varredura de árvore com a fonte permitida já no índice, para os casos R1. */
function varrer(arquivos: Record<string, string | Buffer>) {
  const raiz = repo({
    [FONTE_REL]: `export const TITULAR = '${TITULAR_SINTETICO}';\n`,
    ...arquivos
  });
  return rodar(['--arvore', raiz], { VERIFICAR_TITULAR_ARQUIVO: join(raiz, FONTE_REL) });
}

describe('verificar-nome-autor: revisão R1, formas que escapavam', () => {
  afterEach(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  });

  it.each(FORMAS_R1)('(R1) %s, em arquivo de texto, reprova', (_descricao, forma) => {
    const r = varrer({ 'docs/nota.md': `${forma}\n` });
    expect(r.status).toBe(1);
    expect(r.saida).toContain('docs/nota.md');
  });

  it('(R1) byte NUL no meio do arquivo de texto não é pulo: o nome é achado', () => {
    const r = varrer({ 'webroot/entrada.html': Buffer.from(`\0<p>${TITULAR_SINTETICO}</p>`) });
    expect(r.status).toBe(1);
    expect(r.saida).toContain('webroot/entrada.html');
  });

  it('(R1) arquivo de texto com NUL, sem o nome, reprova com a mensagem de NUL', () => {
    const r = varrer({ 'docs/x.md': Buffer.from('texto\0sem nome') });
    expect(r.status).toBe(1);
    expect(r.saida).toContain('NUL');
  });

  it('(R1) nome nos bytes de uma imagem reprova: extensão de binário não é isenção', () => {
    const r = varrer({ 'imagens/x.png': Buffer.from(`\x89PNG\0${TITULAR_SINTETICO}`) });
    expect(r.status).toBe(1);
    expect(r.saida).toContain('imagens/x.png');
  });

  it('(R1) texto limpo, sem o titular em nenhuma forma, continua passando', () => {
    const r = varrer({ 'docs/limpo.md': 'Texto de estudo sem o titular.\n' });
    expect(r.status).toBe(0);
  });
});
