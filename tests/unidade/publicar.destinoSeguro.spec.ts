import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh, destino seguro (LU-F4.3, revisão de segurança F5.2). Cada caso é um achado:
 * C-1 (destino symlink reaproveita a raiz de outro produto), C-2 (raiz vazia), I-1 (symlink no
 * destino passa na conferência), I-2 (aspas no caminho viram comando), I-3 (host com opção de ssh),
 * item 6 (origem vazia passa com zero arquivo). Cada função é extraída do script; nada roda contra
 * servidor real: o destino é uma árvore temporária, com a raiz terminando em domains/drpetrus.top.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FONTE = readFileSync(join(RAIZ, 'scripts/publicar.sh'), 'utf-8');

let tmp: string;
let raiz: string;

/** Corpo da função do publicar.sh; vazio se ela ainda não existe (o caso então falha pelo comportamento). */
function funcao(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  return m ? m[0] : '';
}

/** Linha de constante do publicar.sh; vazia se ela ainda não existe. */
function linha(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}=.*$`, 'm'));
  return m ? m[0] : '';
}

/** Roda o corpo com as funções reais do publicar.sh e o destino local de teste. */
function rodar(corpo: string, antes: string[] = []): { status: number | null; saida: string } {
  const script = [
    'set -euo pipefail',
    `ESPACO='${join(tmp, 'espaco')}'`,
    'mkdir -p "$ESPACO"',
    'DIVERGENCIAS=0',
    "DESTINO_HOST=''",
    `DESTINO_RAIZ='${raiz}'`,
    `DESTINO_WEBROOT='${raiz}/public_html/direito2026'`,
    `DESTINO_APP='${raiz}/direito2026_app'`,
    `DESTINO_PRIVADO='${raiz}/direito2026_privado'`,
    "SSH_OPCOES='ssh -o BatchMode=yes -o ConnectTimeout=20'",
    linha('DESTINOS_PERMITIDOS'),
    linha('FORMATO_CAMINHO'),
    linha('FORMATO_HOST'),
    ...[
      'recusar',
      'validar_formato_caminho',
      'validar_host_destino',
      'no_destino',
      'conferir_destino_seguro',
      'conferir_md5_pasta'
    ].map(funcao),
    ...antes,
    corpo,
    'echo passou'
  ].join('\n');
  const r = spawnSync('bash', ['-c', script], { encoding: 'utf-8' });
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-destino-'));
  raiz = join(tmp, 'home', 'domains', 'drpetrus.top');
  for (const pasta of ['public_html/direito2026', 'direito2026_app/atual', 'direito2026_privado']) {
    mkdirSync(join(raiz, pasta), { recursive: true });
  }
  writeFileSync(join(raiz, 'public_html', '.htaccess'), 'OUTRO-PRODUTO\n');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('publicar.sh: destino seguro (revisão F5.2)', () => {
  it('destino real sob a raiz passa', () => {
    const r = rodar(`conferir_destino_seguro '${raiz}/public_html/direito2026'`);
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('passou');
  });

  it('C-1: public_html/direito2026 como symlink para public_html é recusado antes de qualquer escrita', () => {
    rmSync(join(raiz, 'public_html', 'direito2026'), { recursive: true });
    symlinkSync('.', join(raiz, 'public_html', 'direito2026'));
    const r = rodar(`conferir_destino_seguro '${raiz}/public_html/direito2026'`);
    expect(r.status, r.saida).not.toBe(0);
    expect(r.saida).toContain('RECUSADO');
    expect(r.saida).not.toContain('passou');
    expect(readFileSync(join(raiz, 'public_html', '.htaccess'), 'utf-8')).toBe('OUTRO-PRODUTO\n');
  });

  it('C-1: pai do destino como symlink é recusado', () => {
    const real = join(tmp, 'fora');
    mkdirSync(join(real, 'direito2026_app'), { recursive: true });
    rmSync(join(raiz, 'direito2026_app'), { recursive: true });
    symlinkSync(real, join(raiz, 'direito2026_app'));
    const r = rodar(`conferir_destino_seguro '${raiz}/direito2026_app/versoes/v1.2.3'`);
    expect(r.status, r.saida).not.toBe(0);
    expect(r.saida).toContain('RECUSADO');
  });

  it('o ponteiro atual (symlink por desenho) não bloqueia o destino do app', () => {
    rmSync(join(raiz, 'direito2026_app', 'atual'), { recursive: true });
    symlinkSync('versoes/v1.0.0', join(raiz, 'direito2026_app', 'atual'));
    const r = rodar(`conferir_destino_seguro '${raiz}/direito2026_app'`);
    expect(r.status, r.saida).toBe(0);
  });

  it('C-2: raiz vazia é recusada e nada é tocado', () => {
    const r = rodar(`DESTINO_RAIZ=''; conferir_destino_seguro '/public_html/direito2026'`);
    expect(r.status, r.saida).not.toBe(0);
    expect(r.saida).toContain('PUBLICAR_DESTINO_RAIZ vazio');
  });

  it('a raiz da hospedagem (public_html) fora da lista fechada é recusada', () => {
    const r = rodar(`conferir_destino_seguro '${raiz}/public_html'`);
    expect(r.status, r.saida).not.toBe(0);
    expect(r.saida).toContain('fora da lista fechada');
  });

  it('a raiz precisa terminar em domains/drpetrus.top', () => {
    const r = rodar(
      `DESTINO_RAIZ='${tmp}/home/outro-produto'; conferir_destino_seguro '${tmp}/home/outro-produto/public_html/direito2026'`
    );
    expect(r.status, r.saida).not.toBe(0);
    expect(r.saida).toContain('RECUSADO');
  });

  it('I-2: caminho com aspas simples é recusado e o comando injetado não roda', () => {
    const marca = join(tmp, 'MARCA-APOS');
    const app = `${raiz}/x'; touch ${marca}; echo '/direito2026_app`;
    const r = rodar(`conferir_destino_seguro "${app}"`);
    expect(r.status, r.saida).not.toBe(0);
    expect(r.saida).toContain('RECUSADO');
    expect(existsSync(marca)).toBe(false);
  });

  it('I-3: host com opção de ssh é recusado e nada é executado', () => {
    const marca = join(tmp, 'MARCA-SSH');
    const r = rodar(`DESTINO_HOST='-oProxyCommand=touch ${marca}'; no_destino true`);
    expect(r.status, r.saida).not.toBe(0);
    expect(r.saida).toContain('RECUSADO');
    expect(r.saida).toContain('fora do formato de alias ssh');
    expect(existsSync(marca)).toBe(false);
  });

  it('item 6: pasta local sem arquivo é recusada (zero é varredura quebrada)', () => {
    const vazia = join(tmp, 'origem-vazia');
    mkdirSync(vazia);
    const r = rodar(`conferir_md5_pasta '${vazia}' '${raiz}/public_html/direito2026' webroot`);
    expect(r.status, r.saida).not.toBe(0);
    expect(r.saida).toContain('RECUSADO');
  });

  it('I-1 no publicar: symlink dentro do destino é divergência, mesmo com o mesmo md5 do arquivo', () => {
    const origem = join(tmp, 'pacote');
    mkdirSync(origem);
    writeFileSync(join(origem, 'a.txt'), 'x\n');
    const destino = join(raiz, 'public_html', 'direito2026');
    writeFileSync(join(destino, 'a.txt'), 'x\n');
    symlinkSync(join(raiz, 'public_html', '.htaccess'), join(destino, 'ligacao.txt'));
    const r = rodar(
      `conferir_md5_pasta '${origem}' '${destino}' webroot; echo "DIVERGENCIAS=$DIVERGENCIAS"`
    );
    expect(r.saida).toContain('symlink');
    expect(r.saida).not.toContain('DIVERGENCIAS=0');
  });
});
