import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh, ordem do webroot (PUBLICAR-NUCLEO-ANTES, LU-F4.3). O núcleo (api/nucleo/) tem de
 * chegar ao destino ANTES dos api/*.php que o chamam: um endpoint novo não pode ficar no ar por segundos
 * com o núcleo antigo. Prova por comportamento: um rsync falso no PATH fotografa o destino a cada chamada
 * (sem -n, ou seja, escrita de verdade) e repassa ao rsync real. Nada toca servidor: tudo num tmpdir.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FONTE = readFileSync(join(RAIZ, 'scripts/publicar.sh'), 'utf-8');

let tmp: string;
let raiz: string;
let pacote: string;
let destinoWebroot: string;
let log: string;

/** Corpo da função do publicar.sh; vazio se não existe (o caso falha, e mostra o motivo). */
function funcao(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  return m ? m[0] : '';
}

/** Linha de constante do publicar.sh; vazia se não existe. */
function linha(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}=.*$`, 'm'));
  return m ? m[0] : '';
}

function md5(conteudo: string): string {
  return createHash('md5').update(conteudo).digest('hex').slice(0, 8);
}

function escrever(caminho: string, conteudo: string): void {
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, conteudo);
}

/**
 * rsync falso: a cada chamada (com escrita), registra a linha de comando, se o endpoint novo já existe e
 * o md5 do núcleo no destino. Se FAKE_FALHA_NUCLEO=1, reprova só a passada do núcleo (exit 23).
 */
function criarRsyncFalso(): string {
  const bin = join(tmp, 'bin');
  mkdirSync(bin, { recursive: true });
  const real = spawnSync('bash', ['-c', 'command -v rsync'], { encoding: 'utf-8' }).stdout.trim();
  const falso = join(bin, 'rsync');
  writeFileSync(
    falso,
    [
      '#!/usr/bin/env bash',
      'linha="$*"',
      'nucleo=""',
      'if [ -f "$FAKE_DEST/api/nucleo/nucleo.php" ]; then nucleo=$(md5sum < "$FAKE_DEST/api/nucleo/nucleo.php" | cut -c1-8); fi',
      'novo=ausente; [ -e "$FAKE_DEST/api/novo.php" ] && novo=presente',
      'if [[ "$linha" != *" -n "* ]]; then echo "ESCRITA | $linha | novo=$novo | nucleo=$nucleo" >> "$FAKE_LOG"; fi',
      'if [ "${FAKE_FALHA_NUCLEO:-0}" = 1 ] && [[ "$linha" == *"/api/nucleo/ "* ]] && [[ "$linha" != *" -n "* ]]; then exit 23; fi',
      `exec '${real}' "$@"`,
      ''
    ].join('\n')
  );
  chmodSync(falso, 0o755);
  return bin;
}

/** Roda enviar_webroot com as funções reais e o destino local de teste. */
function rodar(opcoes: { falhaNucleo?: boolean } = {}): { status: number | null; saida: string } {
  const bin = criarRsyncFalso();
  const script = [
    'set -euo pipefail',
    `ESPACO='${join(tmp, 'espaco')}'`,
    'mkdir -p "$ESPACO"',
    'DIVERGENCIAS=0',
    'DEPLOY_INICIADO=0',
    "DESTINO_HOST=''",
    `DESTINO_RAIZ='${raiz}'`,
    `DESTINO_WEBROOT='${destinoWebroot}'`,
    `DESTINO_WEBROOT_NOVO='${destinoWebroot}_novo'`,
    `DESTINO_APP='${raiz}/direito2026_app'`,
    `DESTINO_PRIVADO='${raiz}/direito2026_privado'`,
    `PACOTE_LOCAL='${pacote}'`,
    `REGRAS='${join(tmp, 'espaco', 'protecao.rules')}'`,
    `: > "$REGRAS"`,
    'TETO_APAGAR_WEBROOT=50',
    "SSH_OPCOES='ssh -o BatchMode=yes -o ConnectTimeout=20'",
    `FAKE_DEST='${destinoWebroot}'`,
    `FAKE_LOG='${log}'`,
    `FAKE_FALHA_NUCLEO='${opcoes.falhaNucleo ? 1 : 0}'`,
    `export FAKE_DEST FAKE_LOG FAKE_FALHA_NUCLEO`,
    `PATH='${bin}':"$PATH"`,
    linha('DESTINOS_PERMITIDOS'),
    linha('FORMATO_CAMINHO'),
    linha('FORMATO_HOST'),
    ...[
      'recusar',
      'validar_formato_caminho',
      'validar_host_destino',
      'conferir_destino_seguro',
      'no_destino',
      'rsync_destino',
      'enviar_nucleo_primeiro',
      'enviar_webroot'
    ].map(funcao),
    'enviar_webroot "$DESTINO_WEBROOT"',
    'echo "FIM deploy_iniciado=$DEPLOY_INICIADO"'
  ].join('\n');
  const r = spawnSync('bash', ['-c', script], { encoding: 'utf-8' });
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

function registros(): string[] {
  return existsSync(log)
    ? readFileSync(log, 'utf-8')
        .split('\n')
        .filter((l) => l !== '')
    : [];
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-nucleo-antes-'));
  raiz = join(tmp, 'home', 'domains', 'drpetrus.top');
  mkdirSync(raiz, { recursive: true });
  pacote = join(tmp, 'pacote');
  destinoWebroot = join(raiz, 'public_html', 'direito2026');
  log = join(tmp, 'rsync.log');
  writeFileSync(log, '');
  // Pacote novo: núcleo v2 e um endpoint novo que chama o núcleo v2.
  escrever(join(pacote, 'webroot', 'api', 'nucleo', 'nucleo.php'), '<?php // nucleo v2 ?>');
  escrever(
    join(pacote, 'webroot', 'api', 'novo.php'),
    '<?php // endpoint novo: chama o nucleo v2 ?>'
  );
  escrever(join(pacote, 'webroot', 'index.html'), '<!doctype html>');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('publicar.sh: o núcleo chega antes dos api/*.php (PUBLICAR-NUCLEO-ANTES)', () => {
  it('destino com núcleo v1 e sem endpoint novo: a passada do núcleo vai antes da passada completa', () => {
    escrever(join(destinoWebroot, 'api', 'nucleo', 'nucleo.php'), '<?php // nucleo v1 ?>');
    escrever(join(destinoWebroot, 'api', 'antigo.php'), '<?php // endpoint antigo ?>');

    const r = rodar();
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('FIM deploy_iniciado=1');

    const escritas = registros();
    const iNucleo = escritas.findIndex(
      (l) => l.includes('/api/nucleo/ ') && !l.includes('--delete')
    );
    const iCompleta = escritas.findIndex((l) => l.includes('--delete'));
    expect(iNucleo, escritas.join('\n')).toBeGreaterThanOrEqual(0);
    expect(iCompleta, escritas.join('\n')).toBeGreaterThan(iNucleo);
    // Na passada do núcleo, o endpoint novo ainda não existe no destino.
    expect(escritas[iNucleo]).toContain('novo=ausente');
    // Na passada completa, o núcleo já é o v2 (copiado antes).
    expect(escritas[iCompleta]).toContain(`nucleo=${md5('<?php // nucleo v2 ?>')}`);
    expect(existsSync(join(destinoWebroot, 'api', 'novo.php'))).toBe(true);
    // A passada completa continua apagando o que não é do pacote (o endpoint antigo).
    expect(existsSync(join(destinoWebroot, 'api', 'antigo.php'))).toBe(false);
  });

  it('webroot novo sem api/: a passada do núcleo cria a pasta e envia antes do resto', () => {
    const r = rodar();
    expect(r.status, r.saida).toBe(0);
    const escritas = registros();
    const iNucleo = escritas.findIndex((l) => l.includes('/api/nucleo/ '));
    const iCompleta = escritas.findIndex((l) => l.includes('--delete'));
    expect(iNucleo).toBeGreaterThanOrEqual(0);
    expect(iCompleta).toBeGreaterThan(iNucleo);
    expect(existsSync(join(destinoWebroot, 'api', 'nucleo', 'nucleo.php'))).toBe(true);
    expect(existsSync(join(destinoWebroot, 'api', 'novo.php'))).toBe(true);
  });

  it('falha na passada do núcleo recusa antes da passada completa: nada do webroot é enviado nem apagado', () => {
    escrever(join(destinoWebroot, 'api', 'antigo.php'), '<?php // endpoint antigo ?>');

    const r = rodar({ falhaNucleo: true });
    expect(r.status).not.toBe(0);
    expect(r.saida).toContain('envio do núcleo (api/nucleo) falhou antes do webroot');
    expect(r.saida).toContain('ponteiro ainda não mudou');
    const escritas = registros();
    expect(escritas.some((l) => l.includes('--delete'))).toBe(false);
    expect(existsSync(join(destinoWebroot, 'api', 'novo.php'))).toBe(false);
    expect(existsSync(join(destinoWebroot, 'api', 'antigo.php'))).toBe(true);
  });

  it('pacote sem api/nucleo recusa antes de qualquer escrita no destino', () => {
    rmSync(join(pacote, 'webroot', 'api', 'nucleo'), { recursive: true, force: true });

    const r = rodar();
    expect(r.status).not.toBe(0);
    expect(r.saida).toContain('pacote sem webroot/api/nucleo');
    expect(registros().filter((l) => l.startsWith('ESCRITA'))).toEqual([]);
  });
});
