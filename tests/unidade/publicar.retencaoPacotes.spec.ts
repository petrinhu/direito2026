import { spawnSync } from 'node:child_process';
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
 * scripts/publicar.sh, retenção dos pacotes guardados (PUBLICAR-PACOTE-APAGADO, decisão do CTO).
 * Depois de um sucesso, o pacote da versão no ar e o da versão anterior ficam (o anterior é o alvo
 * do rollback, e o servidor guarda as duas versões mais novas). Os demais saem, por caminho exato.
 * Falha antes do sucesso não apaga nada. A pasta fica em 700. Cada função é extraída do script, sem
 * rodar o publicar inteiro.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FONTE = readFileSync(join(RAIZ, 'scripts/publicar.sh'), 'utf-8');

const FUNCOES = [
  'recusar',
  'conferir_pasta_segura',
  'preparar_pasta_pacotes',
  'destino_do_pacote',
  'apagar_pacote_versao',
  'reter_pacotes_apos_sucesso',
  'conferir_pacote_guardado',
  'guardar_pacote'
];

let tmp: string;
let pasta: string;

function funcao(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  if (!m) throw new Error(`função ${nome} não encontrada em publicar.sh`);
  return m[0];
}

/** Roda um trecho com as funções reais do publicar.sh, a pasta dada e a versão nova. */
function rodar(corpo: string, versaoNova: string): { status: number | null; saida: string } {
  const r = spawnSync(
    'bash',
    [
      '-c',
      [
        'set -euo pipefail',
        ...FUNCOES.map(funcao),
        `PASTA_PACOTES='${pasta}'`,
        `VERSAO_NOVA='${versaoNova}'`,
        corpo,
        'echo passou'
      ].join('\n')
    ],
    { encoding: 'utf-8' }
  );
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

/** Cria um pacote guardado de versão, em 700, com o app e o webroot mínimos. */
function criarPacote(versao: string): void {
  const dir = join(pasta, `v${versao}`);
  mkdirSync(join(dir, 'app'), { recursive: true, mode: 0o700 });
  mkdirSync(join(dir, 'webroot', 'api'), { recursive: true, mode: 0o700 });
  writeFileSync(join(dir, 'app', 'manifesto.json'), '{}');
  writeFileSync(join(dir, 'webroot', 'api', 'portao.php'), '<?php');
  chmodSync(dir, 0o700);
}

/** Pacotes (pastas v<versão>) que ficaram na pasta dos pacotes, em ordem de versão. */
function pacotesGuardados(): string[] {
  const r = spawnSync(
    'bash',
    ['-c', `cd '${pasta}' && ls -1 | grep -E '^v[0-9.]+$' | sort -V || true`],
    { encoding: 'utf-8' }
  );
  return r.stdout.split('\n').filter((linha) => linha.length > 0);
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-retencao-'));
  pasta = join(tmp, 'pacotes');
  mkdirSync(pasta, { mode: 0o700 });
  chmodSync(pasta, 0o700);
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('retenção dos pacotes guardados (PUBLICAR-PACOTE-APAGADO)', () => {
  it('depois de um sucesso ficam exatamente 2 pacotes: o da versão no ar e o anterior', () => {
    criarPacote('1.0.0');
    criarPacote('1.1.0');
    criarPacote('1.2.0');
    const r = rodar('reter_pacotes_apos_sucesso', '1.2.0');
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('passou');
    expect(pacotesGuardados()).toEqual(['v1.1.0', 'v1.2.0']);
  });

  it('a ordem é a de versão, não a de texto: 1.10.0 é mais nova que 1.9.0', () => {
    criarPacote('1.9.0');
    criarPacote('1.10.0');
    criarPacote('1.11.0');
    const r = rodar('reter_pacotes_apos_sucesso', '1.11.0');
    expect(r.status, r.saida).toBe(0);
    expect(pacotesGuardados()).toEqual(['v1.10.0', 'v1.11.0']);
  });

  it('primeira publicação com o pacote novo, sem anterior: fica só o da versão no ar', () => {
    criarPacote('1.0.0');
    const r = rodar('reter_pacotes_apos_sucesso', '1.0.0');
    expect(r.status, r.saida).toBe(0);
    expect(pacotesGuardados()).toEqual(['v1.0.0']);
  });

  it('sem o pacote da versão nova recusa e não apaga nenhum pacote', () => {
    criarPacote('1.0.0');
    criarPacote('1.1.0');
    const r = rodar('reter_pacotes_apos_sucesso', '1.2.0');
    expect(r.status).toBe(1);
    expect(r.saida).toContain('nada foi apagado');
    expect(pacotesGuardados()).toEqual(['v1.0.0', 'v1.1.0']);
  });

  it('versão fora do padrão recusa e não apaga nenhum pacote', () => {
    criarPacote('1.0.0');
    criarPacote('1.1.0');
    const r = rodar('reter_pacotes_apos_sucesso', '1.x');
    expect(r.status).toBe(1);
    expect(pacotesGuardados()).toEqual(['v1.0.0', 'v1.1.0']);
  });

  it('arquivo solto na pasta, que não é pacote, não é apagado', () => {
    criarPacote('1.0.0');
    criarPacote('1.1.0');
    criarPacote('1.2.0');
    writeFileSync(join(pasta, 'publicacao-em-andamento'), 'marca');
    const r = rodar('reter_pacotes_apos_sucesso', '1.2.0');
    expect(r.status, r.saida).toBe(0);
    expect(existsSync(join(pasta, 'publicacao-em-andamento'))).toBe(true);
    expect(pacotesGuardados()).toEqual(['v1.1.0', 'v1.2.0']);
  });

  it('a pasta dos pacotes continua em 700 depois da retenção', () => {
    criarPacote('1.0.0');
    criarPacote('1.1.0');
    criarPacote('1.2.0');
    const r = rodar("reter_pacotes_apos_sucesso\nconferir_pasta_segura '" + pasta + "'", '1.2.0');
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('passou');
  });

  it('o pacote guardado nasce em pasta 700, com o app e o webroot dentro', () => {
    const local = join(tmp, 'clone-dist-pacote');
    mkdirSync(join(local, 'app'), { recursive: true });
    mkdirSync(join(local, 'webroot', 'api'), { recursive: true });
    writeFileSync(join(local, 'app', 'manifesto.json'), '{}');
    writeFileSync(join(local, 'webroot', 'api', 'portao.php'), '<?php');
    const r = rodar(
      `PACOTE_LOCAL='${local}'\nguardar_pacote\nstat -c %a '${join(pasta, 'v1.2.0')}'`,
      '1.2.0'
    );
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('700');
    expect(readFileSync(join(pasta, 'v1.2.0', 'app', 'manifesto.json'), 'utf-8')).toBe('{}');
  });
});

describe('onde a retenção é chamada (falha não apaga nada)', () => {
  const principal = (): string => funcao('principal');
  const concluir = (): string => funcao('concluir');

  it('o publicar só apaga pacote dentro da retenção, depois de conferir_ar e enviar_ao_git', () => {
    const corpo = principal();
    const posConferir = corpo.indexOf('conferir_ar');
    const posEnviar = corpo.indexOf('enviar_ao_git');
    const posReter = corpo.indexOf('reter_pacotes_apos_sucesso');
    expect(posReter).toBeGreaterThan(-1);
    expect(posReter).toBeGreaterThan(posConferir);
    expect(posReter).toBeGreaterThan(posEnviar);
    expect(corpo.indexOf('PUBLICADO=1')).toBeGreaterThan(posReter);
  });

  it('o --concluir chama a retenção depois de provar o clone fresco', () => {
    const corpo = concluir();
    const posProvar = corpo.indexOf('provar_clone_fresco');
    const posReter = corpo.indexOf('reter_pacotes_apos_sucesso');
    expect(posReter).toBeGreaterThan(-1);
    expect(posReter).toBeGreaterThan(posProvar);
  });

  it('fora de guardar_pacote (reexecução) e da própria retenção, ninguém apaga a versão nova direto', () => {
    const fora = [
      funcao('reter_pacotes_apos_sucesso'),
      funcao('apagar_pacote_versao'),
      funcao('guardar_pacote')
    ].reduce((texto, bloco) => texto.replace(bloco, ''), FONTE);
    expect(fora.match(/apagar_pacote_versao "\$VERSAO_NOVA"/g) ?? []).toHaveLength(0);
  });
});
