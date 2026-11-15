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
const SCRIPT = join(RAIZ, 'scripts/verificar-nome-autor.ts');
const TITULAR_SINTETICO = 'Ana Exposta Açucena';
const FONTE_REL = 'src/conteudo/sobre/autoria.ts';
const CABECALHO_CIFRA = Buffer.from('\0GITCRYPT\0');

let tmp: string;

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
  return { status: r.status ?? -1, saida: r.stdout ?? '' };
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
  });

  it('(g) fonte cifrada reprova, porque a trava só roda com a chave destravada', () => {
    const raiz = repo({ 'src/a.ts': 'x\n' });
    const cifrada = criarFonte(raiz, Buffer.concat([CABECALHO_CIFRA, Buffer.from('ab')]));
    const r = rodar(['--arvore', raiz], { VERIFICAR_TITULAR_ARQUIVO: cifrada });
    expect(r.status).toBe(1);
  });
});

describe('verificar-nome-autor: modo pacote e resposta anônima', () => {
  afterEach(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
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

  const env = (raiz: string) => ({
    VERIFICAR_TITULAR_ARQUIVO: join(raiz, '..', 'nao-usado-no-pacote.ts')
  });

  it('(d) nome em app/index.html do pacote reprova', () => {
    const raiz = pacote({ 'app/index.html': `<p>${TITULAR_SINTETICO}</p>` });
    const fonte = join(raiz, 'fonte.ts');
    writeFileSync(fonte, `export const TITULAR = '${TITULAR_SINTETICO}';\n`);
    const r = rodar(['--pacote', raiz], { VERIFICAR_TITULAR_ARQUIVO: fonte, ...env(raiz) });
    expect(r.status).toBe(1);
  });

  it('(e) nome no webroot do pacote reprova', () => {
    const raiz = pacote({ 'webroot/entrada.css': `/* ${TITULAR_SINTETICO} */` });
    const fonte = join(raiz, 'fonte.ts');
    writeFileSync(fonte, `export const TITULAR = '${TITULAR_SINTETICO}';\n`);
    const r = rodar(['--pacote', raiz], { VERIFICAR_TITULAR_ARQUIVO: fonte });
    expect(r.status).toBe(1);
  });

  it('o nome dentro de app/*.js é a exceção estreita e passa', () => {
    const raiz = pacote({ 'app/rodape-abc.js': `const t="${TITULAR_SINTETICO}";` });
    const fonte = join(raiz, 'fonte.ts');
    writeFileSync(fonte, `export const TITULAR = '${TITULAR_SINTETICO}';\n`);
    const r = rodar(['--pacote', raiz], { VERIFICAR_TITULAR_ARQUIVO: fonte });
    expect(r.status).toBe(0);
  });

  it('(f) nome na resposta anônima do servidor reprova; sem o nome, passa', () => {
    const raiz = pacote({ 'resposta.html': `<p>${TITULAR_SINTETICO}</p>` });
    const fonte = join(raiz, 'fonte.ts');
    writeFileSync(fonte, `export const TITULAR = '${TITULAR_SINTETICO}';\n`);
    expect(
      rodar(['--entrada', join(raiz, 'resposta.html')], { VERIFICAR_TITULAR_ARQUIVO: fonte }).status
    ).toBe(1);
    writeFileSync(join(raiz, 'resposta.html'), '<p>Entre com sua senha.</p>');
    expect(
      rodar(['--entrada', join(raiz, 'resposta.html')], { VERIFICAR_TITULAR_ARQUIVO: fonte }).status
    ).toBe(0);
  });
});
