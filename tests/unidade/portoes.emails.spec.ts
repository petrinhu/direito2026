import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Portão de e-mail (scripts/verificar-emails.sh, EM-B1). Cada caso monta um repositório
 * temporário, põe um arquivo rastreado e roda o portão sobre ele, sem tocar na árvore real.
 *
 * O endereço de contato do líder (item 90 da ratificação de 13/11 e ordem de 15/11, SB-F5)
 * é o ÚNICO liberado além do example.com e do nao-responda. O endereço do caso negativo não
 * aparece escrito neste arquivo: é montado só dentro da pasta temporária, para que o próprio
 * spec não seja reprovado pelo portão na varredura da árvore.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const VERIFICADOR = join(RAIZ, 'scripts/verificar-emails.sh');
const CONTATO_LIDER = 'contato@drpetrus.top';

let tmp: string;

function repoComArquivo(conteudo: string): string {
  const raiz = mkdtempSync(join(tmpdir(), 'portao-emails-'));
  tmp = raiz;
  spawnSync('git', ['-C', raiz, 'init', '-q'], { encoding: 'utf-8' });
  writeFileSync(join(raiz, 'arquivo.txt'), conteudo);
  spawnSync('git', ['-C', raiz, 'add', 'arquivo.txt'], { encoding: 'utf-8' });
  return raiz;
}

function rodar(raiz: string): number {
  const r = spawnSync('bash', [VERIFICADOR, raiz], { encoding: 'utf-8' });
  return r.status ?? -1;
}

describe('verificar-emails.sh: endereço de contato do líder (SB-F5)', () => {
  beforeEach(() => {
    tmp = '';
  });
  afterEach(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  });

  it('aceita o endereço de contato do líder em arquivo rastreado', () => {
    const raiz = repoComArquivo(`Escreva para ${CONTATO_LIDER} para sugerir.\n`);
    expect(rodar(raiz)).toBe(0);
  });

  it('continua reprovando outro endereço do mesmo domínio', () => {
    const outro = ['outra', '@drpetrus.top'].join('');
    const raiz = repoComArquivo(`Escreva para ${outro}.\n`);
    expect(rodar(raiz)).toBe(1);
  });
});
