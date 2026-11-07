import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Portão da Júri fora do pacote (scripts/verificar-juri-fora-do-pacote.ts, E13 e
 * 5.5). A imagem da Júri agora vai em claro: a magia JURI saiu. O portão olha
 * dois alvos, a árvore rastreada (só nomes, git ls-files) e a pasta de build
 * (dist). Cada caso planta um nome sintético e prova o critério (L-36). O id
 * abaixo é de zeros e nomes hex: nenhuma imagem real, nenhum conteúdo.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const VERIFICADOR = join(RAIZ, 'scripts/verificar-juri-fora-do-pacote.ts');
const ID_SINTETICO = '0123456789abcdef0123456789abcdef';

let tmp: string;
let dist: string;
let arvore: string;

function rodar(distCaminho: string = dist) {
  return spawnSync(process.execPath, ['--import', 'tsx', VERIFICADOR], {
    cwd: RAIZ,
    encoding: 'utf-8',
    env: { ...process.env, DIST_PATH: distCaminho, VERIFICAR_JURI_RAIZ: arvore }
  });
}

function plantar(nome: string, conteudo: string = 'sintetico'): void {
  const caminho = join(dist, nome);
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, conteudo);
}

function rastrear(nome: string): void {
  const caminho = join(arvore, nome);
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, 'sintetico');
  spawnSync('git', ['add', '--', nome], { cwd: arvore });
}

function saidaCompleta(r: { stdout: string; stderr: string }): string {
  return r.stdout + r.stderr;
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'juri-fora-do-pacote-'));
  dist = join(tmp, 'dist');
  arvore = join(tmp, 'arvore');
  mkdirSync(dist);
  mkdirSync(arvore);
  spawnSync('git', ['init', '-q'], { cwd: arvore });
  rastrear('README.md');
  plantar('index.html', '<!doctype html><title>site</title>');
  plantar('assets/app.js', 'console.log("pacote publico");');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('portão da Júri fora do pacote', () => {
  it('árvore e dist limpos passam e imprimem encontrados/analisados/falharam', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    expect(saidaCompleta(r)).toContain('encontrados=2 analisados=2 falharam=0');
    expect(saidaCompleta(r)).toContain('[dist]');
    expect(saidaCompleta(r)).toContain('[arvore]');
  });

  it('arquivo .juri reprova pela extensão', () => {
    plantar('assets/x.juri');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('extensão .juri');
  });

  it.each(['acervo.json', 'credencial-admin.json', 'ids.tsv', 'conferencia.tsv', 'juri.json'])(
    'nome proibido %s reprova no dist',
    (nome) => {
      plantar(`sub/${nome}`, '{"sintetico":true}');
      const r = rodar();
      expect(r.status).toBe(1);
      expect(saidaCompleta(r)).toContain('nome proibido');
    }
  );

  it('pasta originais/ no dist reprova, em qualquer nível', () => {
    plantar('originais/recorte.webp');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('pasta originais');
  });

  it('nome de id (32 hex) no dist reprova', () => {
    plantar(`assets/${ID_SINTETICO}`);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('nome de id');
  });

  it('imagens/<id> sem extensão no dist reprova (a foto em claro não pode sair assim)', () => {
    plantar(`imagens/${ID_SINTETICO}`);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('imagem sem extensão');
  });

  it('arquivo com extensão dentro de imagens/ passa (formato em claro com nome legível)', () => {
    plantar('imagens/exemplo.webp');
    const r = rodar();
    expect(r.status).toBe(0);
  });

  it('nome de id na árvore rastreada reprova', () => {
    rastrear(`public/${ID_SINTETICO}`);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('[arvore]');
  });

  it('pasta imagens/ rastreada sem extensão reprova na árvore', () => {
    rastrear('public/imagens/cabecalho');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('imagem sem extensão');
  });

  it('dist sem arquivo algum reprova (varredura vazia é falha, L-36)', () => {
    rmSync(join(dist, 'index.html'));
    rmSync(join(dist, 'assets'), { recursive: true, force: true });
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('encontrados=0 analisados=0 falharam=0');
  });

  it('dist ausente reprova (falha fechada)', () => {
    const r = rodar(join(tmp, 'nao-existe'));
    expect(r.status).toBe(1);
  });

  it('o build chama o verificador', () => {
    const pacote = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
    };
    expect(pacote.scripts.build).toContain('scripts/verificar-juri-fora-do-pacote.ts');
  });
});
