import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh, ordem da fase pública (AV-F5, revisão F4/F5, OS-1 do CTO). Antes de trocar o
 * ponteiro, só leitura: teto e colisão da quarentena. Depois, anterior, envio, ponteiro, conferência
 * do ar, envio ao git e, por último, a poda (quarentena). Se a poda falhar no fim, a versão já está
 * no ar e no git: sai com código 3 e a frase "publicado, poda pendente", sem aviso de remoto parcial.
 *
 * Cada etapa pública é trocada por função que registra a chamada num arquivo temporário. Nada roda
 * de verdade: nenhum ssh, nenhum rsync, nenhum git real. PUBLICAR_SCRIPT aponta para uma cópia
 * sabotada na prova de estreia (L-27, L-36).
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLICAR = process.env.PUBLICAR_SCRIPT ?? join(RAIZ, 'scripts/publicar.sh');
const FONTE = readFileSync(PUBLICAR, 'utf-8');
const BASE_TEMP = process.env.TMPDIR ?? '/var/tmp';
const TIMEOUT = 60_000;

let tmp: string;

/** Texto de uma função do publicar.sh; vazio se a função não existe (o teste mostra o erro). */
function funcaoOuVazio(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  return m ? m[0] : '';
}

/** Funções reais que o cenário exercita. */
const REAIS = [
  'recusar',
  'apagar_clone',
  'ao_sair',
  'principal',
  'publicar_versao',
  'checar_poda_previa',
  'versoes_a_podar',
  'podar_versoes',
  'comando_quarentena'
];

/** Etapas trocadas por registro: cada chamada vira uma linha no arquivo de log. */
const ETAPAS = [
  'ler_argumentos',
  'conferir_publicacao_interrompida',
  'conferir_branch_e_arvore',
  'calcular_versoes',
  'conferir_tag_local',
  'validar_novidades_publicacao',
  'imprimir_plano',
  'conferir_destinos',
  'conferir_remoto',
  'conferir_insumos',
  'marcar_em_andamento',
  'gravar_e_commitar',
  'criar_tag',
  'preparar_clone',
  'copiar_dispositivos',
  'rodar_preci',
  'conferir_pacote_local',
  'conferir_historico_pacote',
  'guardar_pacote',
  'preparar_regras',
  'preparar_destinos',
  'anterior_no_destino',
  'enviar_senhas_comuns',
  'enviar_app',
  'enviar_webroot',
  'trocar_ponteiro',
  'montar_caminhos_protegidos',
  'conferir_ar',
  'enviar_ao_git',
  'apagar_pacote_versao',
  'conferir_destino_seguro'
];

interface Cenario {
  /** Versões que existem no destino, da mais nova para a mais velha. */
  versoes: string[];
  /** Quarentena já ocupada: o teste de existência falha. */
  colisao?: boolean;
  /** Etapa que falha (nome da etapa ou "mv", o movimento da quarentena). */
  falha?: string;
}

const NO_DESTINO = `no_destino() {
  local tipo=outro
  case "$1" in
    *"mv --"*) tipo=mv ;;
    *"test ! -e"*) tipo=test ;;
    *"ls -1 versoes"*) tipo=ls ;;
  esac
  echo "no_destino:$tipo" >> "$LOG"
  case "$tipo" in
    ls) printf '%s\\n' $VERSOES_DESTINO ;;
    test) [ -z "\${COLISAO:-}" ] ;;
    mv) [ "\${FALHA:-}" != mv ] ;;
  esac
}`;

function roteiro(alvo: 'principal' | 'podar', c: Cenario, log: string, espaco: string): string {
  // enviar_app, na função real, marca DEPLOY_INICIADO=1 antes do primeiro escrito no destino.
  const stubs = ETAPAS.map(
    (nome) =>
      `${nome}() { ${nome === 'enviar_app' ? 'DEPLOY_INICIADO=1; ' : ''}echo ${nome} >> "$LOG"; [ "\${FALHA:-}" != ${nome} ]; }`
  );
  return [
    'set -euo pipefail',
    ...REAIS.map(funcaoOuVazio),
    ...stubs,
    NO_DESTINO,
    `LOG='${log}'`,
    `FAKE_ESPACO='${espaco}'`,
    'mktemp() { echo "$FAKE_ESPACO"; }',
    'git() { echo 0123456789abcdef; }',
    `VERSOES_DESTINO='${c.versoes.join(' ')}'`,
    c.colisao ? 'COLISAO=1' : 'COLISAO=',
    c.falha ? `FALHA='${c.falha}'` : 'FALHA=',
    'MODO=normal',
    'SECO=0',
    'TETO_VERSOES=5',
    "DESTINO_APP='/var/x/app'",
    "DESTINO_WEBROOT='/var/x/webroot'",
    "DESTINO_WEBROOT_NOVO='/var/x/webroot_novo'",
    "DESTINO_PRIVADO='/var/x/privado'",
    'VERSAO_NOVA=1.13.0.0',
    'TIPO=recurso',
    'CLONE=',
    'ESPACO=',
    'DEPLOY_INICIADO=0',
    'PUBLICADO=0',
    'RELEASE_FEITO=0',
    'TAG_CRIADA=0',
    'SHA_RELEASE=',
    'PACKAGE_ALTERADO=0',
    'PUSH_MAIN_FEITO=0',
    'PUSH_TAG_FEITO=0',
    'DIVERGENCIAS=0',
    alvo === 'principal' ? 'trap ao_sair EXIT\nprincipal' : 'podar_versoes'
  ].join('\n');
}

function executar(
  alvo: 'principal' | 'podar',
  c: Cenario
): { status: number | null; saida: string; chamadas: string[] } {
  const log = join(tmp, 'chamadas.log');
  writeFileSync(log, '');
  const espaco = join(tmp, 'espaco');
  const r = spawnSync('bash', ['-c', roteiro(alvo, c, log, espaco)], {
    encoding: 'utf-8',
    env: { ...process.env, TMPDIR: tmp }
  });
  const chamadas = readFileSync(log, 'utf-8')
    .split('\n')
    .filter((linha) => linha !== '' && !linha.startsWith('conferir_destino_seguro'));
  return { status: r.status, saida: `${r.stdout}${r.stderr}`, chamadas };
}

const OITO_VERSOES = [
  'v1.12.0.0',
  'v1.11.0.0',
  'v1.10.0.0',
  'v1.9.0.0',
  'v1.8.0.0',
  'v1.7.0.0',
  'v1.6.0.0',
  'v1.5.0.0'
];
const TRES_VERSOES = ['v1.12.0.0', 'v1.11.0.0', 'v1.10.0.0'];

beforeEach(() => {
  tmp = mkdtempSync(join(BASE_TEMP, 'publicar-ordem-'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('ordem da fase pública (AV-F5, OS-1)', () => {
  it(
    'ordem feliz: leitura da poda antes do ponteiro, conferência e envio antes da poda, e a poda por último',
    () => {
      const r = executar('principal', { versoes: TRES_VERSOES });
      expect(r.status, r.saida).toBe(0);
      expect(r.chamadas).toEqual([
        'ler_argumentos',
        'conferir_publicacao_interrompida',
        'conferir_branch_e_arvore',
        'calcular_versoes',
        'conferir_tag_local',
        'validar_novidades_publicacao',
        'conferir_destinos',
        'conferir_remoto',
        'conferir_insumos',
        'marcar_em_andamento',
        'preparar_clone',
        'copiar_dispositivos',
        'rodar_preci',
        'conferir_pacote_local',
        'conferir_historico_pacote',
        'gravar_e_commitar',
        'criar_tag',
        'guardar_pacote',
        'preparar_regras',
        'no_destino:ls',
        'no_destino:test',
        'anterior_no_destino',
        'enviar_senhas_comuns',
        'enviar_app',
        'enviar_webroot',
        'trocar_ponteiro',
        'montar_caminhos_protegidos',
        'conferir_ar',
        'enviar_ao_git',
        'apagar_pacote_versao',
        'no_destino:ls',
        'no_destino:mv'
      ]);
      expect(r.saida).toContain('publicado: v1.13.0.0');
    },
    TIMEOUT
  );

  it(
    'teto da poda estourado recusa antes de qualquer escrita pública (ponteiro e envio intactos)',
    () => {
      const r = executar('principal', { versoes: OITO_VERSOES });
      expect(r.status).not.toBe(0);
      expect(r.saida).toContain('teto');
      expect(r.chamadas).not.toContain('enviar_app');
      expect(r.chamadas).not.toContain('enviar_webroot');
      expect(r.chamadas).not.toContain('trocar_ponteiro');
      expect(r.chamadas).not.toContain('no_destino:mv');
    },
    TIMEOUT
  );

  it(
    'quarentena já ocupada recusa antes de qualquer escrita pública',
    () => {
      const r = executar('principal', { versoes: TRES_VERSOES, colisao: true });
      expect(r.status).not.toBe(0);
      expect(r.saida).toContain('quarentena');
      expect(r.chamadas).not.toContain('enviar_app');
      expect(r.chamadas).not.toContain('trocar_ponteiro');
      expect(r.chamadas).not.toContain('no_destino:mv');
    },
    TIMEOUT
  );

  it(
    'poda que falha no fim: sai com código 3 e diz "publicado, poda pendente", sem aviso de remoto parcial',
    () => {
      const r = executar('principal', { versoes: TRES_VERSOES, falha: 'mv' });
      expect(r.status, r.saida).toBe(3);
      expect(r.saida).toContain('publicado, poda pendente');
      expect(r.saida).not.toContain('ABORTADO');
      expect(r.saida).not.toContain('remoto');
      const envio = r.chamadas.indexOf('enviar_ao_git');
      const movimento = r.chamadas.indexOf('no_destino:mv');
      expect(envio).toBeGreaterThan(-1);
      expect(movimento).toBeGreaterThan(envio);
    },
    TIMEOUT
  );

  it(
    'podar_versoes recusa acima do teto e não move nada (teto da própria poda, sem depender da pré-checagem)',
    () => {
      const r = executar('podar', { versoes: OITO_VERSOES });
      expect(r.status).not.toBe(0);
      expect(r.saida).toContain('teto');
      expect(r.chamadas).not.toContain('no_destino:mv');
    },
    TIMEOUT
  );

  it(
    'falha em conferir_ar, depois do ponteiro, mantém o aviso ABORTADO, o remoto parcial e o diagnóstico, e não sai com 3',
    () => {
      const r = executar('principal', { versoes: TRES_VERSOES, falha: 'conferir_ar' });
      expect(r.status, r.saida).toBe(1);
      expect(r.saida).toContain('ABORTADO após iniciar o deploy');
      expect(r.saida).toContain('O remoto pode estar parcial');
      expect(r.saida).toContain('arquivos de diagnóstico mantidos');
      expect(r.saida).not.toContain('poda pendente');
      expect(r.chamadas).toContain('trocar_ponteiro');
      expect(r.chamadas).toContain('conferir_ar');
      expect(r.chamadas).not.toContain('enviar_ao_git');
      expect(r.chamadas).not.toContain('no_destino:mv');
    },
    TIMEOUT
  );
});
