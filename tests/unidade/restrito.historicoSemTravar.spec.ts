import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ARGS_HISTORICO, varrerHistorico } from '../../scripts/apoio/varrerHistorico';

/**
 * E2 (plano do CTO do login único, F1.2): o portão de histórico não pode
 * travar com stderr cheio. Reprodução medida em F0.4: o textconv do git-crypt
 * escreve centenas de KB no stderr; com o pipe sem leitor, o processo trava.
 *
 * Termos sintéticos e neutros: nenhum vem do caderno restrito. A prova vermelha
 * é o próprio timeout: contra o código que trava, a promessa não resolve.
 */

const TERMO = 'termo sintetico plantado';
const TAMANHO_STDERR = 400_000;
const LIMITE_MS = 15_000;

let raiz: string;
let dirFerramentas: string;

function git(cwd: string, args: string[]): void {
  execFileSync(
    'git',
    ['-c', `core.hooksPath=${join(raiz, 'sem-hooks')}`, '-c', 'commit.gpgsign=false', ...args],
    { cwd, stdio: 'ignore' }
  );
}

function escreverFerramentas(): void {
  // textconv ruidoso: escreve no stderr antes de devolver o conteúdo. É o que o git-crypt faz.
  writeFileSync(
    join(dirFerramentas, 'textconv-ruidoso.cjs'),
    `const fs = require('node:fs');\n` +
      `process.stderr.write('a'.repeat(${TAMANHO_STDERR}));\n` +
      `process.stdout.write(fs.readFileSync(process.argv[2]));\n`
  );
  // comando injetado: 400 KB de stderr e o termo no stdout. Prova a drenagem sem depender do git.
  writeFileSync(
    join(dirFerramentas, 'stderr-cheio.cjs'),
    `process.stderr.write('b'.repeat(${TAMANHO_STDERR}));\n` +
      `process.stdout.write('linha com ${TERMO} no meio\\n');\n`
  );
}

beforeAll(() => {
  raiz = mkdtempSync(join(tmpdir(), 'e2-historico-'));
  dirFerramentas = join(raiz, 'ferramentas');
  mkdirSync(dirFerramentas);
  mkdirSync(join(raiz, 'sem-hooks'));
  escreverFerramentas();

  git(raiz, ['init', '-q', '.']);
  git(raiz, ['config', 'user.email', 'teste@exemplo.invalido']);
  git(raiz, ['config', 'user.name', 'teste']);
  // Atributo diff=ruido sem filtro de cifra: o blob fica em claro, como um commit antigo.
  git(raiz, [
    'config',
    'diff.ruido.textconv',
    `${process.execPath} ${join(dirFerramentas, 'textconv-ruidoso.cjs')}`
  ]);
  writeFileSync(join(raiz, '.gitattributes'), 'ruido.txt diff=ruido\n');
  writeFileSync(join(raiz, 'ruido.txt'), `primeira linha\n${TERMO}\n`);
  git(raiz, ['add', '.gitattributes', 'ruido.txt']);
  git(raiz, ['commit', '-q', '-m', 'teste: termo plantado em blob em claro']);
});

afterAll(() => {
  rmSync(raiz, { recursive: true, force: true });
});

describe('varrerHistorico: não trava com stderr cheio (E2)', () => {
  it('o portão de histórico usa --no-textconv, para não rodar o textconv de cifra', () => {
    expect(ARGS_HISTORICO).toContain('--no-textconv');
  });

  it(
    'com textconv ruidoso no repositório, termina a tempo e acha o termo plantado',
    async () => {
      const achados = await varrerHistorico([TERMO], { cwd: raiz, timeoutMs: LIMITE_MS });
      expect(achados.encontrados.has(0)).toBe(true);
    },
    LIMITE_MS + 10_000
  );

  it(
    'com 400 KB de stderr do comando, drena e acha o termo no stdout',
    async () => {
      const achados = await varrerHistorico([TERMO], {
        cwd: raiz,
        comando: process.execPath,
        args: [join(dirFerramentas, 'stderr-cheio.cjs')],
        timeoutMs: LIMITE_MS
      });
      expect(achados.encontrados.has(0)).toBe(true);
    },
    LIMITE_MS + 10_000
  );

  it(
    'termo ausente não aparece nos achados (sem falso positivo)',
    async () => {
      const achados = await varrerHistorico(['termo sintetico que nao existe'], {
        cwd: raiz,
        timeoutMs: LIMITE_MS
      });
      expect(achados.encontrados.size).toBe(0);
    },
    LIMITE_MS + 10_000
  );

  it('falha fechada: comando que não existe rejeita, não devolve zero achados', async () => {
    await expect(
      varrerHistorico([TERMO], {
        cwd: raiz,
        comando: 'comando-que-nao-existe-e2',
        timeoutMs: LIMITE_MS
      })
    ).rejects.toThrow();
  });
});
