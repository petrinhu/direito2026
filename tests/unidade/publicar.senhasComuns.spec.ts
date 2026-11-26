import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * NIST-SENHAS-PROIBIDAS: scripts/publicar.sh leva servidor/dados/senhas-proibidas.txt (do clone do
 * commit base) para a pasta privada do destino, com md5 conferido, antes de o app novo subir. As
 * funções são extraídas do próprio script; o rsync e o ssh são trocados por cópia e execução local.
 * Provas: (1) a lista chega ao privado com modo 600; (2) cópia divergente recusa; (3) lista ausente
 * recusa; (4) o envio vem antes do app em publicar_versao e em preparar_destinos.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLICAR = join(RAIZ, 'scripts/publicar.sh');
const FONTE = readFileSync(PUBLICAR, 'utf-8');

let tmp: string;

/** Corpo de uma função do publicar.sh: do `nome() {` até o `}` que fecha na coluna 0. */
function funcao(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  if (!m) throw new Error(`função ${nome} não encontrada em publicar.sh`);
  return m[0];
}

/**
 * Roda enviar_senhas_comuns com o CLONE e o privado em pastas temporárias. `corromper` troca o
 * conteúdo que chega ao privado, para simular divergência de cópia.
 */
function rodar(opcoes: { lista: boolean; corromper: boolean }) {
  const clone = join(tmp, 'clone');
  const privado = join(tmp, 'privado');
  mkdirSync(join(clone, 'servidor/dados'), { recursive: true });
  if (opcoes.lista) {
    writeFileSync(join(clone, 'servidor/dados/senhas-proibidas.txt'), 'azul\nverde\n');
  }
  const script = [
    'set -u',
    'ESPACO="$(mktemp -d)"',
    'DIVERGENCIAS=0',
    `CLONE='${clone}'`,
    `DESTINO_PRIVADO='${privado}'`,
    'conferir_destino_seguro() { :; }',
    // Execução local no lugar do ssh. Com corrupção, o md5 que volta do destino é de outro conteúdo.
    opcoes.corromper
      ? `no_destino() { case "$1" in md5sum*) echo 00000000000000000000000000000000 ;; *) bash -c "$1" ;; esac; }`
      : 'no_destino() { bash -c "$1"; }',
    // rsync_destino real do script (rsync local, sem host): o --chmod=F600 vale como em produção.
    'validar_host_destino() { :; }',
    "DESTINO_HOST=''",
    'SSH_OPCOES=""',
    funcao('rsync_destino'),
    funcao('conferir_md5_arquivo'),
    funcao('recusar'),
    funcao('enviar_senhas_comuns'),
    'enviar_senhas_comuns',
    'echo "fim-ok"'
  ].join('\n');
  const r = spawnSync('bash', ['-c', script], { encoding: 'utf-8' });
  return { r, privado };
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-senhas-'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('publicar.sh e a lista de senhas comuns', () => {
  it('o script continua com sintaxe válida', () => {
    const r = spawnSync('bash', ['-n', PUBLICAR], { encoding: 'utf-8' });
    expect(r.status, r.stderr).toBe(0);
  });

  it('leva a lista ao privado, com modo 600 e md5 conferido', () => {
    const { r, privado } = rodar({ lista: true, corromper: false });
    expect(r.status, r.stderr + r.stdout).toBe(0);
    expect(readFileSync(join(privado, 'senhas-proibidas.txt'), 'utf-8')).toBe('azul\nverde\n');
    expect(statSync(join(privado, 'senhas-proibidas.txt')).mode & 0o777).toBe(0o600);
  });

  it('recusa quando a cópia no destino diverge do arquivo local', () => {
    const { r } = rodar({ lista: true, corromper: true });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('RECUSADO');
    expect(r.stdout).not.toContain('fim-ok');
  });

  it('recusa quando a lista não existe no clone (fail secure)', () => {
    const { r } = rodar({ lista: false, corromper: false });
    expect(r.status).not.toBe(0);
    expect(r.stdout).not.toContain('fim-ok');
  });

  it('envia a lista antes do app, em publicar_versao e em preparar_destinos', () => {
    for (const nome of ['publicar_versao', 'preparar_destinos']) {
      const corpo = funcao(nome);
      const chamada = corpo.indexOf('enviar_senhas_comuns');
      const app = corpo.indexOf('enviar_app');
      expect(chamada, `${nome} não chama enviar_senhas_comuns`).toBeGreaterThanOrEqual(0);
      expect(chamada, `${nome} envia o app antes da lista`).toBeLessThan(app);
    }
  });
});
