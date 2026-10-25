import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh copia os dispositivos.ts gerados para a cópia de publicação
 * ($WT, .worktrees/pub). Esses arquivos são ignorados pelo git, então sobrevivem
 * ao checkout do commit da tag. Quando uma unidade troca de pasta, a pasta antiga
 * ficava em $WT só com dispositivos.ts, sem meta.ts, e o preci reprovava a
 * publicação inteira ("pasta de unidade sem meta.ts"). Estes testes provam que a
 * cópia de publicação fica só com os dispositivos.ts atuais, e que nada que o git
 * rastreia, nada fora de src/conteudo e nenhuma árvore principal é tocado.
 *
 * Repositório e worktree são temporários, em /var/tmp, criados aqui e apagados
 * no fim. A configuração global do git fica de fora para que o hook global do
 * líder não rode nos commits deste repositório de teste.
 */
const LIB = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../scripts/apoio/dispositivos-publicacao.sh'
);
const AMBIENTE_GIT = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };

let tmp: string;
let raiz: string;
let wt: string;

function git(cwd: string, ...args: string[]): void {
  const r = spawnSync(
    'git',
    [
      '-c',
      'user.name=teste',
      '-c',
      'user.email=teste@exemplo.invalido',
      '-c',
      'commit.gpgSign=false',
      ...args
    ],
    { cwd, encoding: 'utf8', env: AMBIENTE_GIT }
  );
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} falhou: ${r.stderr}`);
}

function escrever(caminho: string, conteudo: string): void {
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, conteudo);
}

function executarCopia(raizArg: string, wtArg: string) {
  return spawnSync(
    'bash',
    [
      '-c',
      'set -euo pipefail; source "$1"; copiar_dispositivos_gerados "$2" "$3" || exit 1',
      'teste',
      LIB,
      raizArg,
      wtArg
    ],
    { encoding: 'utf8' }
  );
}

// Árvore principal: unidades atuais, com dispositivos.ts gerados e ignorados.
function montarPrincipal(): void {
  escrever(join(raiz, '.gitignore'), 'src/conteudo/**/dispositivos.ts\n*.cache\ndist/\n');
  escrever(join(raiz, 'src/conteudo/p1/x/u1/meta.ts'), 'export const meta = { nome: "u1" };\n');
  escrever(
    join(raiz, 'src/conteudo/p1/x/u3-novo/meta.ts'),
    'export const meta = { nome: "u3-novo" };\n'
  );
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'base');
  git(raiz, 'worktree', 'add', '-q', '--detach', wt, 'HEAD');
  escrever(join(raiz, 'src/conteudo/p1/x/u1/dispositivos.ts'), 'ATUAL u1\n');
  escrever(join(raiz, 'src/conteudo/p1/x/u3-novo/dispositivos.ts'), 'ATUAL u3-novo\n');
}

// Sobras de uma geração anterior na cópia de publicação ($WT).
function plantarSobras(): void {
  // Pasta que trocou de nome: só dispositivos.ts, nenhum arquivo rastreado.
  escrever(join(wt, 'src/conteudo/p1/x/u3/dispositivos.ts'), 'ANTIGO u3\n');
  // Pasta que continua existindo: dispositivos.ts a ser recopiado, mais arquivo
  // rastreado (meta.ts) e ignorado com outro nome (indice.cache).
  escrever(join(wt, 'src/conteudo/p1/x/u1/dispositivos.ts'), 'ANTIGO u1\n');
  escrever(join(wt, 'src/conteudo/p1/x/u1/indice.cache'), 'cache\n');
  // Pasta com arquivo não ignorado: a pasta fica, só o dispositivos.ts sai.
  escrever(join(wt, 'src/conteudo/p1/x/velho/dispositivos.ts'), 'ANTIGO velho\n');
  escrever(join(wt, 'src/conteudo/p1/x/velho/rascunho.txt'), 'não ignorado\n');
  // Fora de src/conteudo: mesmo nome, ignorado, mas não é da unidade.
  escrever(join(wt, 'dist/dispositivos.ts'), 'fora de src/conteudo\n');
}

beforeEach(() => {
  tmp = mkdtempSync(join(process.env.TMPDIR ?? '/var/tmp', 'pubfix-'));
  raiz = join(tmp, 'principal');
  wt = join(tmp, 'pub');
  mkdirSync(raiz);
  git(raiz, 'init', '-q');
  montarPrincipal();
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('copiar_dispositivos_gerados: limpeza da cópia de publicação', () => {
  it('apaga o dispositivos.ts de pasta que trocou de nome, e a pasta que ficou vazia junto', () => {
    plantarSobras();
    const r = executarCopia(raiz, wt);
    expect(r.status, r.stderr).toBe(0);
    expect(existsSync(join(wt, 'src/conteudo/p1/x/u3/dispositivos.ts'))).toBe(false);
    expect(existsSync(join(wt, 'src/conteudo/p1/x/u3'))).toBe(false);
  });

  it('deixa a cópia só com os dispositivos.ts atuais da árvore principal', () => {
    plantarSobras();
    const r = executarCopia(raiz, wt);
    expect(r.status, r.stderr).toBe(0);
    expect(readFileSync(join(wt, 'src/conteudo/p1/x/u1/dispositivos.ts'), 'utf8')).toBe(
      'ATUAL u1\n'
    );
    expect(readFileSync(join(wt, 'src/conteudo/p1/x/u3-novo/dispositivos.ts'), 'utf8')).toBe(
      'ATUAL u3-novo\n'
    );
    expect(existsSync(join(wt, 'src/conteudo/p1/x/velho/dispositivos.ts'))).toBe(false);
  });

  it('não apaga arquivo rastreado, nem arquivo ignorado de outro nome, nem pasta que ainda tem arquivo', () => {
    plantarSobras();
    const r = executarCopia(raiz, wt);
    expect(r.status, r.stderr).toBe(0);
    expect(readFileSync(join(wt, 'src/conteudo/p1/x/u1/meta.ts'), 'utf8')).toBe(
      'export const meta = { nome: "u1" };\n'
    );
    expect(existsSync(join(wt, 'src/conteudo/p1/x/u1/indice.cache'))).toBe(true);
    expect(existsSync(join(wt, 'src/conteudo/p1/x/velho/rascunho.txt'))).toBe(true);
    expect(existsSync(join(wt, 'src/conteudo/p1/x'))).toBe(true);
  });

  it('não toca nada fora de src/conteudo, mesmo com dispositivos.ts ignorado', () => {
    plantarSobras();
    const r = executarCopia(raiz, wt);
    expect(r.status, r.stderr).toBe(0);
    expect(existsSync(join(wt, 'dist/dispositivos.ts'))).toBe(true);
  });

  it('imprime a contagem de dispositivos.ts antigos removidos e a de copiados', () => {
    plantarSobras();
    const r = executarCopia(raiz, wt);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('publicar: dispositivos.ts antigos removidos: 3');
    expect(r.stdout).toContain('publicar: dispositivos.ts copiados: 2');
  });

  it('imprime removidos: 0 quando não há sobra', () => {
    const r = executarCopia(raiz, wt);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('publicar: dispositivos.ts antigos removidos: 0');
  });

  it('recusa e não apaga nada quando a árvore principal não tem dispositivos.ts', () => {
    plantarSobras();
    rmSync(join(raiz, 'src/conteudo/p1/x/u1/dispositivos.ts'));
    rmSync(join(raiz, 'src/conteudo/p1/x/u3-novo/dispositivos.ts'));
    const r = executarCopia(raiz, wt);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('nenhum dispositivos.ts gerado');
    expect(existsSync(join(wt, 'src/conteudo/p1/x/u3/dispositivos.ts'))).toBe(true);
  });

  it('recusa quando o destino não é a raiz de um worktree e não mexe na árvore principal', () => {
    // Pasta comum dentro da árvore principal: o git enxerga a árvore principal
    // como dona dos arquivos, então a limpeza não pode rodar aqui.
    const falso = join(raiz, 'sem-git');
    escrever(join(falso, 'src/conteudo/p1/x/u3/dispositivos.ts'), 'ANTIGO u3\n');
    const r = executarCopia(raiz, falso);
    expect(r.status).not.toBe(0);
    expect(existsSync(join(falso, 'src/conteudo/p1/x/u3/dispositivos.ts'))).toBe(true);
    expect(existsSync(join(raiz, 'src/conteudo/p1/x/u1/dispositivos.ts'))).toBe(true);
    expect(existsSync(join(raiz, 'src/conteudo/p1/x/u3-novo/dispositivos.ts'))).toBe(true);
  });
});
