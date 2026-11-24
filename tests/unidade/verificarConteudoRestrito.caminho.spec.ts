import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CAMINHO_RESTRITO_PADRAO, caminhoRestrito } from '../../scripts/apoio/caminhoRestrito';

/**
 * RESTRITO-CAMINHO: scripts/verificar-conteudo-restrito.ts lê o JSON restrito pelo caminho que vem de
 * CADERNO_RESTRITO. Vazia ou ausente, cai no padrão relativo à raiz. Este spec NÃO lê o conteúdo real do
 * restrito: todo JSON é sintético, criado num tmpdir, e a raiz do repositório também é um tmpdir (REPO_RAIZ),
 * para que o padrão relativo aponte para a fixture e nunca para a área restrita de verdade.
 *
 * Provas por saída, sem o termo: o script imprime "termos:" só depois de ler e parsear o JSON. "malformado"
 * sai quando o caminho aponta para um diretório (o bug antigo: CADERNO_RESTRITO vazio virava a própria raiz).
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = join(RAIZ, 'scripts/verificar-conteudo-restrito.ts');

let tmp: string;
let repo: string;
let padrao: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'restrito-caminho-'));
  // O padrão relativo, visto a partir de REPO_RAIZ, é tmp/site_direito2026_restrito/...
  repo = join(tmp, 'fixture-repo');
  mkdirSync(repo, { recursive: true });
  padrao = join(tmp, 'site_direito2026_restrito', 'conteudo', 'interdisciplinar.json');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function escrever(caminho: string, conteudo: string): string {
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, conteudo);
  return caminho;
}

/** Roda o portão com o CADERNO_RESTRITO dado (undefined = variável ausente). Nunca herda a do processo. */
function rodar(valor: string | undefined): { status: number | null; saida: string } {
  const ambiente: Record<string, string> = { REPO_RAIZ: repo };
  for (const [chave, v] of Object.entries(process.env)) {
    if (v !== undefined && chave !== 'CADERNO_RESTRITO') ambiente[chave] = v;
  }
  if (valor !== undefined) ambiente.CADERNO_RESTRITO = valor;
  const r = spawnSync('node', ['--import', 'tsx', SCRIPT], {
    cwd: RAIZ,
    env: ambiente,
    encoding: 'utf-8'
  });
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

describe('caminhoRestrito (RESTRITO-CAMINHO): escolha do caminho, sem ler o arquivo', () => {
  const raiz = '/raiz/do/repo';

  it('ausente cai no padrão relativo à raiz', () => {
    expect(caminhoRestrito(undefined, raiz)).toBe(resolve(raiz, CAMINHO_RESTRITO_PADRAO));
  });

  it('vazio cai no padrão (não vira a própria raiz)', () => {
    expect(caminhoRestrito('', raiz)).toBe(resolve(raiz, CAMINHO_RESTRITO_PADRAO));
    expect(caminhoRestrito('', raiz)).not.toBe(raiz);
  });

  it('caminho absoluto no ambiente vence o padrão', () => {
    expect(caminhoRestrito('/outro/lugar/x.json', raiz)).toBe('/outro/lugar/x.json');
  });

  it('caminho relativo no ambiente é resolvido a partir da raiz', () => {
    expect(caminhoRestrito('conteudo/x.json', raiz)).toBe(resolve(raiz, 'conteudo/x.json'));
  });
});

describe('verificar-conteudo-restrito: CADERNO_RESTRITO escolhe o JSON (RESTRITO-CAMINHO)', () => {
  it('com CADERNO_RESTRITO apontando para o JSON, lê desse caminho e não do padrão', () => {
    // O padrão tem JSON inválido: se o script lesse o padrão, sairia "malformado".
    escrever(padrao, 'isto não é json');
    const alvo = escrever(join(tmp, 'outro', 'restrito.json'), '{}');
    const r = rodar(alvo);
    expect(r.saida).toContain('termos:');
    expect(r.saida).not.toContain('malformado');
  });

  it('CADERNO_RESTRITO vazio cai no padrão relativo (o bug antigo saía "malformado")', () => {
    escrever(padrao, '{}');
    const r = rodar('');
    expect(r.saida).toContain('termos:');
    expect(r.saida).not.toContain('malformado');
  });

  it('CADERNO_RESTRITO ausente cai no padrão relativo', () => {
    escrever(padrao, '{}');
    const r = rodar(undefined);
    expect(r.saida).toContain('termos:');
    expect(r.saida).not.toContain('malformado');
  });

  it('vazio e sem o padrão: falha fechada, com "ausente", e sai diferente de zero', () => {
    const r = rodar('');
    expect(r.status).not.toBe(0);
    expect(r.saida).toContain('JSON privado ausente');
  });

  it('CADERNO_RESTRITO apontando para arquivo inexistente: falha fechada, sem cair no padrão', () => {
    escrever(padrao, '{}');
    const r = rodar(join(tmp, 'nao-existe.json'));
    expect(r.status).not.toBe(0);
    expect(r.saida).toContain('JSON privado ausente');
    expect(r.saida).not.toContain('termos:');
  });
});
