import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/verificar-proibicoes.sh --amplo (LU-F1.3-N3). A varredura ampliada cobre README.md e
 * CLAUDE.md da raiz, os .md de docs/ (subpastas inclusive) em claro e o NOME de todo arquivo rastreado (cifrados
 * inclusive). Os casos com repositório temporário usam um termo inventado, nunca o termo real.
 * O caso do repositório atual usa o arquivo de termos de verdade (~/.config/secrets), por isso
 * falha, de propósito, se ele não existir: o portão não passa em silêncio.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = join(RAIZ, 'scripts/verificar-proibicoes.sh');
const TERMO_INVENTADO = 'termoinventadoxqz';
const MAGICA_GIT_CRYPT = '\u0000GITCRYPT\u0000';

let tmp: string;
let termos: string;

/** Repositório git temporário com os arquivos dados, todos no índice (git add, sem commit). */
function criarRepo(arquivos: Record<string, string>): string {
  const dir = join(tmp, 'repo');
  mkdirSync(dir, { recursive: true });
  spawnSync('git', ['init', '-q', dir], { encoding: 'utf-8' });
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    const abs = join(dir, caminho);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, conteudo);
  }
  spawnSync('git', ['-C', dir, 'add', '-A'], { encoding: 'utf-8' });
  return dir;
}

function rodarAmplo(raiz: string, termosArquivo: string) {
  return spawnSync('bash', [SCRIPT, '--amplo', raiz], {
    encoding: 'utf-8',
    env: { ...process.env, VERIFICAR_PROIBICOES_TERMOS: termosArquivo }
  });
}

const BASE = { 'README.md': '# Projeto\n', 'CLAUDE.md': '# Regras\n' };

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'vp-amplo-'));
  termos = join(tmp, 'termos.txt');
  writeFileSync(termos, `${TERMO_INVENTADO}\n`);
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('verificar-proibicoes --amplo (LU-F1.3-N3)', () => {
  it('reprova README.md com termo proibido, e a saída não imprime o termo', () => {
    const repo = criarRepo({ ...BASE, 'README.md': `# Projeto\n\nveja ${TERMO_INVENTADO}\n` });
    const r = rodarAmplo(repo, termos);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('README.md');
    expect(r.stdout + r.stderr).not.toContain(TERMO_INVENTADO);
  });

  it('reprova nome de arquivo rastreado com termo proibido', () => {
    const repo = criarRepo({ ...BASE, [`notas-${TERMO_INVENTADO}.txt`]: 'texto neutro\n' });
    const r = rodarAmplo(repo, termos);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain(`PROIBIÇÃO NO NOME DO ARQUIVO: notas-${TERMO_INVENTADO}.txt`);
  });

  it('reprova nome de arquivo cifrado com termo proibido, sem ler o conteúdo', () => {
    const repo = criarRepo({
      ...BASE,
      [`docs/${TERMO_INVENTADO}.md`]: `${MAGICA_GIT_CRYPT}resto binário`
    });
    const r = rodarAmplo(repo, termos);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain(`docs/${TERMO_INVENTADO}.md`);
  });

  it('reprova docs/*.md em claro com termo proibido, em subpasta também', () => {
    const repo = criarRepo({
      ...BASE,
      'docs/auditoria/relato.md': `texto com ${TERMO_INVENTADO} no meio\n`
    });
    const r = rodarAmplo(repo, termos);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('docs/auditoria/relato.md');
    expect(r.stdout + r.stderr).not.toContain(TERMO_INVENTADO);
  });

  it('não lê conteúdo cifrado de docs/: termo dentro de arquivo com a assinatura passa', () => {
    const repo = criarRepo({
      ...BASE,
      'docs/cifrado.md': `${MAGICA_GIT_CRYPT}${TERMO_INVENTADO} binário`
    });
    const r = rodarAmplo(repo, termos);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('cifrado pulado: 1');
  });

  it('um arquivo de texto sem termo passa e as contagens aparecem', () => {
    const repo = criarRepo({ ...BASE, 'src/a.ts': 'export const x = 1;\n' });
    const r = rodarAmplo(repo, termos);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('achados: 0');
    expect(r.stdout).toContain('nomes rastreados varridos: 3');
  });

  it('zero arquivo rastreado reprova (portão quebrado, não código limpo)', () => {
    const dir = join(tmp, 'vazio');
    mkdirSync(dir, { recursive: true });
    spawnSync('git', ['init', '-q', dir], { encoding: 'utf-8' });
    const r = rodarAmplo(dir, termos);
    expect(r.status).not.toBe(0);
  });

  // Herda o ambiente como o passo do preci: a caixa do publicar exporta VERIFICAR_PROIBICOES_TERMOS
  // com o caminho real. Não zerar a variável: zerá-la faz o verificador cair no $HOME, que não tem o arquivo.
  it('o repositório atual passa com o arquivo de termos real', () => {
    const r = spawnSync('bash', [SCRIPT, '--amplo', RAIZ], { encoding: 'utf-8', env: process.env });
    expect(r.stderr).not.toContain('arquivo de termos ausente');
    expect(r.status, `saída:\n${r.stdout}\n${r.stderr}`).toBe(0);
    expect(r.stdout).toContain('achados: 0');
  });
});
