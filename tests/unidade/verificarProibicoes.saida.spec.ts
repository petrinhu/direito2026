import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/verificar-proibicoes.sh, modos antigos (fonte, público, dist, stdin): a saída de achado
 * traz caminho e número da linha, nunca o termo nem o trecho da linha. O modo --amplo já era assim
 * (PROIBICOES-SAIDA-SEM-TERMO). Todo termo deste spec é inventado e injetado por arquivo temporário
 * (VERIFICAR_PROIBICOES_TERMOS): a lista real, em ~/.config/secrets, nunca entra em arquivo versionado.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = join(RAIZ, 'scripts/verificar-proibicoes.sh');
// Termo com acento e caixa mista: o script compara sem caixa e sem acento, então o achado pega
// a forma em caixa alta e sem acento. O spec confere a saída pela mesma regra.
const TERMO = 'Inventárioqzx';
const FORMA_NO_ARQUIVO = 'INVENTARIOQZX';

let tmp: string;
let termos: string;

/** Saída em forma comparável: sem caixa e sem acento, como o próprio script compara. */
function comparavel(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase();
}

function rodar(args: string[], entrada?: string) {
  return spawnSync('bash', [SCRIPT, ...args], {
    encoding: 'utf-8',
    input: entrada,
    env: { ...process.env, VERIFICAR_PROIBICOES_TERMOS: termos }
  });
}

/** Diretório temporário com os arquivos dados (caminho relativo ao diretório). */
function criarDir(arquivos: Record<string, string>): string {
  const dir = join(tmp, 'alvo');
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    const abs = join(dir, caminho);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, conteudo);
  }
  return dir;
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'vp-saida-'));
  termos = join(tmp, 'termos.txt');
  writeFileSync(termos, `${TERMO}\n`);
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('verificar-proibicoes, saída sem o termo (PROIBICOES-SAIDA-SEM-TERMO)', () => {
  it('modo de diretório: arquivo com termo reprova, com caminho e linha, sem o termo', () => {
    const dir = criarDir({
      'sub/a.ts': `linha um\nlinha dois com ${FORMA_NO_ARQUIVO} no meio\n`,
      'b.ts': 'texto neutro\n'
    });
    const r = rodar([dir]);
    const saida = r.stdout + r.stderr;
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain(`PROIBIÇÃO ENCONTRADA em ${join(dir, 'sub/a.ts')}, linha 2`);
    expect(comparavel(saida)).not.toContain(comparavel(TERMO));
    expect(saida).not.toContain(FORMA_NO_ARQUIVO);
    expect(saida).not.toContain('Inventário');
  });

  it('modo de diretório: arquivo limpo passa e a contagem aparece', () => {
    const dir = criarDir({ 'a.ts': 'export const x = 1;\n' });
    const r = rodar([dir]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('arquivos varridos: 1');
    expect(r.stderr).toBe('');
  });

  it('modo de entrada padrão (-): reprova, com número da linha, sem o termo', () => {
    const r = rodar(['-'], `primeira linha\nsegunda ${FORMA_NO_ARQUIVO}\n`);
    const saida = r.stdout + r.stderr;
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('PROIBIÇÃO ENCONTRADA (resposta do servidor), linha 2');
    expect(comparavel(saida)).not.toContain(comparavel(TERMO));
    expect(saida).not.toContain(FORMA_NO_ARQUIVO);
  });

  it('nome de arquivo: reprova com a forma só de caminho, sem a forma antiga entre aspas', () => {
    const dir = criarDir({ [`nota-${FORMA_NO_ARQUIVO}.txt`]: 'texto neutro\n' });
    const r = rodar([dir]);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain(
      `PROIBIÇÃO NO NOME DO ARQUIVO: ${join(dir, `nota-${FORMA_NO_ARQUIVO}.txt`)}`
    );
    expect(r.stderr).not.toMatch(/'[^']*' em /);
  });
});
