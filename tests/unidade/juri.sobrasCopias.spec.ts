import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { criarPastaCopias, PREFIXO_COPIAS, varrerSobras } from '../../scripts/juri/sobras';

/*
 * Dados falsos e base de teste própria: nada aqui toca a /var/tmp real nem o acervo.
 * Cada pasta falsa tem nome no formato do mkdtemp (6 caracteres) e um arquivo de bytes
 * sintéticos dentro, como uma cópia de imagem teria.
 */

const DIA_MS = 24 * 60 * 60 * 1000;
const AGORA = Date.now();
const PID_MORTO = 424242;
const PID_VIVO = 535353;
let base = '';

function fazerPasta(nome: string, opcoes: { pid?: string; mtimeMs?: number } = {}): string {
  const dir = join(base, nome);
  mkdirSync(dir, { mode: 0o700 });
  writeFileSync(join(dir, 'copia.jpg'), 'BYTES-SINTETICOS', { mode: 0o600 });
  if (opcoes.pid !== undefined) {
    writeFileSync(join(dir, '.pid'), opcoes.pid, { mode: 0o600 });
  }
  // Por último: escrever arquivo dentro da pasta muda o mtime, então ajusta depois.
  const mtime = new Date(opcoes.mtimeMs ?? AGORA - DIA_MS);
  utimesSync(dir, mtime, mtime);
  return dir;
}

/** Só enxerga como vivo o PID_VIVO; qualquer outro está morto. */
const soVivo = (pid: number): boolean => pid === PID_VIVO;

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'juri-sobras-teste-'));
  chmodSync(base, 0o700);
});

afterEach(() => {
  if (!base.includes('juri-sobras-teste-')) {
    throw new Error(`recusa apagar fora do prefixo de teste: ${base}`);
  }
  rmSync(base, { recursive: true, force: true });
});

describe('prefixo das cópias', () => {
  it('é o mesmo prefixo que o mkdtemp usa em metadados.ts', () => {
    expect(PREFIXO_COPIAS).toBe('juri-acervo-');
  });
});

describe('varrerSobras: o que apaga', () => {
  it('apaga sobra antiga cujo processo morreu', () => {
    const sobra = fazerPasta('juri-acervo-AAAAAA', { pid: String(PID_MORTO) });
    const r = varrerSobras(base, { pidVivo: soVivo, inicioProcessoMs: AGORA });
    expect(r).toEqual({ apagadas: 1, falhas: 0 });
    expect(existsSync(sobra)).toBe(false);
  });

  it('apaga sobra antiga sem .pid (anterior a este conserto)', () => {
    const sobra = fazerPasta('juri-acervo-BBBBBB');
    const r = varrerSobras(base, { pidVivo: soVivo, inicioProcessoMs: AGORA });
    expect(r).toEqual({ apagadas: 1, falhas: 0 });
    expect(existsSync(sobra)).toBe(false);
  });
});

describe('varrerSobras: o que preserva', () => {
  it('preserva a pasta de processo vivo (outra execução em andamento)', () => {
    const viva = fazerPasta('juri-acervo-CCCCCC', { pid: String(PID_VIVO) });
    const r = varrerSobras(base, { pidVivo: soVivo, inicioProcessoMs: AGORA });
    expect(r).toEqual({ apagadas: 0, falhas: 0 });
    expect(existsSync(viva)).toBe(true);
  });

  it('preserva pasta de processo vivo usando a checagem real de pid (processo pai)', () => {
    const viva = fazerPasta('juri-acervo-DDDDDD', { pid: String(process.ppid) });
    const r = varrerSobras(base, { inicioProcessoMs: AGORA });
    expect(r.apagadas).toBe(0);
    expect(existsSync(viva)).toBe(true);
  });

  it('preserva a pasta da própria execução corrente, mesmo com pid morto no teste', () => {
    const propria = fazerPasta('juri-acervo-EEEEEE', { pid: '777' });
    const r = varrerSobras(base, {
      pidVivo: () => false,
      pidAtual: 777,
      inicioProcessoMs: AGORA
    });
    expect(r.apagadas).toBe(0);
    expect(existsSync(propria)).toBe(true);
  });

  it('ignora link simbólico com o prefixo exato e não toca o alvo', () => {
    const alvo = join(base, 'alvo-externo');
    mkdirSync(alvo, { mode: 0o700 });
    writeFileSync(join(alvo, 'segredo-sintetico.txt'), 'DADO-SINTETICO', { mode: 0o600 });
    const link = join(base, 'juri-acervo-FFFFFF');
    symlinkSync(alvo, link);
    const r = varrerSobras(base, { pidVivo: soVivo, inicioProcessoMs: AGORA });
    expect(r).toEqual({ apagadas: 0, falhas: 0 });
    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    expect(existsSync(join(alvo, 'segredo-sintetico.txt'))).toBe(true);
  });

  it('preserva prefixos diferentes, mesmo parecidos', () => {
    const nomes = [
      'juri-acervo-teste-AAAAAA',
      'juri-acervo-AAAAAAA',
      'juri-acervo-AAAAA',
      'juri-acervo2-AAAAAA',
      'xjuri-acervo-AAAAAA',
      'outra-pasta-AAAAAA'
    ];
    const pastas = nomes.map((nome) => fazerPasta(nome));
    const r = varrerSobras(base, { pidVivo: soVivo, inicioProcessoMs: AGORA });
    expect(r.apagadas).toBe(0);
    for (const pasta of pastas) {
      expect(existsSync(pasta)).toBe(true);
    }
  });

  it('preserva pasta mais nova que o início do processo atual', () => {
    const recente = fazerPasta('juri-acervo-GGGGGG', { mtimeMs: AGORA - DIA_MS });
    const r = varrerSobras(base, {
      pidVivo: soVivo,
      inicioProcessoMs: AGORA - 2 * DIA_MS
    });
    expect(r.apagadas).toBe(0);
    expect(existsSync(recente)).toBe(true);
  });

  it('preserva pasta de outro dono (uid diferente do usuário atual)', () => {
    const alheia = fazerPasta('juri-acervo-HHHHHH', { pid: String(PID_MORTO) });
    const r = varrerSobras(base, {
      pidVivo: soVivo,
      inicioProcessoMs: AGORA,
      uidAtual: (process.getuid?.() ?? 0) + 1
    });
    expect(r.apagadas).toBe(0);
    expect(existsSync(alheia)).toBe(true);
  });

  it('preserva arquivo comum com o prefixo (só diretório é sobra)', () => {
    const arquivo = join(base, 'juri-acervo-JJJJJJ');
    writeFileSync(arquivo, 'NAO-E-PASTA', { mode: 0o600 });
    const r = varrerSobras(base, { pidVivo: soVivo, inicioProcessoMs: AGORA });
    expect(r.apagadas).toBe(0);
    expect(existsSync(arquivo)).toBe(true);
  });

  it('preserva quando o .pid não é número (leitura incerta, falha fechada)', () => {
    const duvida = fazerPasta('juri-acervo-KKKKKK', { pid: 'lixo-nao-numerico' });
    const r = varrerSobras(base, { pidVivo: soVivo, inicioProcessoMs: AGORA });
    expect(r.apagadas).toBe(0);
    expect(existsSync(duvida)).toBe(true);
  });

  it('preserva quando o .pid é link simbólico', () => {
    const dir = fazerPasta('juri-acervo-LLLLLL');
    const alvoPid = join(base, 'alvo-pid');
    writeFileSync(alvoPid, String(PID_MORTO), { mode: 0o600 });
    symlinkSync(alvoPid, join(dir, '.pid'));
    const mtime = new Date(AGORA - DIA_MS);
    utimesSync(dir, mtime, mtime);
    const r = varrerSobras(base, { pidVivo: soVivo, inicioProcessoMs: AGORA });
    expect(r.apagadas).toBe(0);
    expect(existsSync(dir)).toBe(true);
  });
});

describe('criarPastaCopias', () => {
  it('cria pasta 700 com o prefixo exato e .pid do processo atual', () => {
    const dir = criarPastaCopias(base);
    const nome = dir.slice(base.length + 1);
    expect(nome).toMatch(/^juri-acervo-[A-Za-z0-9]{6}$/);
    expect(lstatSync(dir).mode & 0o777).toBe(0o700);
    expect(lstatSync(join(dir, '.pid')).mode & 0o777).toBe(0o600);
    expect(readFileSync(join(dir, '.pid'), 'utf8')).toBe(String(process.pid));
  });
});
