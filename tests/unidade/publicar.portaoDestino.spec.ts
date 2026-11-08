import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  cpSync,
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
 * scripts/publicar.sh, conferir-portao no destino (PUB-1, LU-F6.1). Defeito: a conferência rodava
 * `cd <pasta> && ... php conferir-portao.php <atual>` com o núcleo e o app em caminho relativo ao home
 * do destino. Depois do cd, esses caminhos deixam de resolver e o CLI responde "núcleo não encontrado".
 * Os specs locais usavam raiz absoluta e por isso nunca pegaram o defeito. Aqui o destino é um home
 * falso com raiz relativa, acessado por um stub de ssh que faz o que o ssh faz: entra no home e roda o
 * comando. O caso com raiz absoluta, no modo local, mantém a paridade. Nada toca servidor real.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// PUBLICAR_SH: só este teste lê a variável, para rodar o mesmo spec contra uma cópia do script (mutação).
const FONTE = readFileSync(process.env.PUBLICAR_SH ?? join(RAIZ, 'scripts/publicar.sh'), 'utf-8');

const FUNCOES = [
  'recusar',
  'validar_formato_caminho',
  'validar_host_destino',
  'no_destino',
  'rsync_destino',
  'conferir_destino_seguro',
  'conferir_portao_no_destino'
];

const CORPO =
  'conferir_portao_no_destino "$DESTINO_WEBROOT/api/nucleo" "$DESTINO_APP/atual"; echo "DIVERGENCIAS=$DIVERGENCIAS"';

let tmp: string;
let home: string;
let remota: string;
let stub: string;

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

/** Destino de um caso: host ssh (vazio = modo local) e raiz (relativa ao home, ou absoluta). */
interface Cenario {
  host: string;
  raiz: string;
}

/** Roda o corpo com as funções reais do publicar.sh e o destino do cenário. */
function rodar(cenario: Cenario, corpo: string): { status: number | null; saida: string } {
  const script = [
    'set -euo pipefail',
    `RAIZ='${RAIZ}'`,
    `ESPACO='${join(tmp, 'espaco')}'`,
    'mkdir -p "$ESPACO"',
    'DIVERGENCIAS=0',
    `DESTINO_HOST='${cenario.host}'`,
    `DESTINO_RAIZ='${cenario.raiz}'`,
    `DESTINO_WEBROOT='${cenario.raiz}/public_html/direito2026'`,
    `DESTINO_APP='${cenario.raiz}/direito2026_app'`,
    `DESTINO_PRIVADO='${cenario.raiz}/direito2026_privado'`,
    `SSH_OPCOES='${stub}'`,
    linha('DESTINOS_PERMITIDOS'),
    linha('FORMATO_CAMINHO'),
    linha('FORMATO_HOST'),
    ...FUNCOES.map(funcao),
    corpo,
    'echo passou'
  ].join('\n');
  const r = spawnSync('bash', ['-c', script], { encoding: 'utf-8' });
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

/** Núcleo publicado no destino: cópia de public/api/nucleo, no webroot do app. */
function montarNucleo(raizRemota: string): void {
  const destino = join(raizRemota, 'public_html', 'direito2026', 'api', 'nucleo');
  mkdirSync(dirname(destino), { recursive: true });
  cpSync(join(RAIZ, 'public', 'api', 'nucleo'), destino, { recursive: true });
}

/** App sintético em direito2026_app/atual, com manifesto no formato do separador ({versao, arquivos}). */
function montarApp(raizRemota: string): void {
  const atual = join(raizRemota, 'direito2026_app', 'atual');
  mkdirSync(join(atual, 'assets'), { recursive: true });
  writeFileSync(join(atual, 'index.html'), '<!doctype html><p>CONTEUDO-SINTETICO-HTML</p>');
  writeFileSync(join(atual, 'assets', 'app.js'), 'var x = "CONTEUDO-SINTETICO-JS";');
  const arquivos: Record<string, { tipo: string; bytes: number; md5: string }> = {};
  const tipos: [string, string][] = [
    ['index.html', 'text/html; charset=utf-8'],
    ['assets/app.js', 'text/javascript; charset=utf-8']
  ];
  for (const [caminho, tipo] of tipos) {
    const conteudo = readFileSync(join(atual, caminho));
    arquivos[caminho] = {
      tipo,
      bytes: conteudo.length,
      md5: createHash('md5').update(conteudo).digest('hex')
    };
  }
  writeFileSync(join(atual, 'manifesto.json'), JSON.stringify({ versao: '0.0.0.0', arquivos }));
}

/**
 * Privado sintético no destino (LU-C1): enviar_dados_juri já criou imagens/ antes do portão.
 * Imagens de bytes sintéticos; o portão confere só nome e tamanho, nunca o conteúdo.
 */
function montarPrivado(raizRemota: string, quantidade: number): void {
  const privado = join(raizRemota, 'direito2026_privado');
  mkdirSync(join(privado, 'imagens'), { recursive: true });
  const indice = Array.from({ length: quantidade }, (_, i) => {
    const id = (i + 1).toString(16).padStart(32, '0');
    const conteudo = Buffer.from(`CONTEUDO-SINTETICO-JURI-${i}`);
    writeFileSync(join(privado, 'imagens', id), conteudo);
    return {
      id,
      tipo: 'jpeg',
      bytes: conteudo.length,
      sha256: createHash('sha256').update(conteudo).digest('hex')
    };
  });
  writeFileSync(join(privado, 'acervo.json'), JSON.stringify({ indice }));
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-portao-'));
  home = join(tmp, 'home');
  remota = join(home, 'domains', 'drpetrus.top');
  // Stub de ssh: aceita "-- host comando" (no_destino) e "host rsync --server ..." (rsync -e).
  // Como o ssh, entra no home do destino antes de rodar o comando.
  stub = join(tmp, 'ssh-falso');
  writeFileSync(
    stub,
    ['#!/bin/sh', '[ "$1" = -- ] && shift', 'shift', `cd '${home}' && exec sh -c "$*"`, ''].join(
      '\n'
    )
  );
  chmodSync(stub, 0o755);
  montarNucleo(remota);
  montarApp(remota);
  montarPrivado(remota, 2);
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('publicar.sh: conferir-portao no destino (PUB-1, LU-F6.1)', () => {
  it('PUB-1: com raiz relativa ao home, o portão confere o app sem trocar de pasta', () => {
    const r = rodar({ host: 'falso', raiz: 'domains/drpetrus.top' }, CORPO);
    expect(r.status, r.saida).toBe(0);
    expect(r.saida, r.saida).not.toContain('núcleo não encontrado');
    expect(r.saida, r.saida).toContain('[PASSOU] conferir-portao');
    expect(r.saida, r.saida).toContain('encontrados=2 analisados=2 falharam=0');
    expect(r.saida, r.saida).toContain('DIVERGENCIAS=0');
    expect(r.saida, r.saida).not.toContain('CONTEUDO-SINTETICO');
  });

  it('LU-C1: o portão do destino também confere o acervo da Júri no privado (--privado)', () => {
    const r = rodar({ host: 'falso', raiz: 'domains/drpetrus.top' }, CORPO);
    expect(r.status, r.saida).toBe(0);
    expect(r.saida, r.saida).toContain('acervo: encontrados=2 analisados=2 falharam=0');
    expect(r.saida, r.saida).toContain('DIVERGENCIAS=0');
    expect(r.saida, r.saida).not.toContain('CONTEUDO-SINTETICO');
  });

  it('paridade: no modo local, com raiz absoluta, o portão confere o app (verde antes e depois)', () => {
    const r = rodar({ host: '', raiz: remota }, CORPO);
    expect(r.status, r.saida).toBe(0);
    expect(r.saida, r.saida).toContain('[PASSOU] conferir-portao');
    expect(r.saida, r.saida).toContain('DIVERGENCIAS=0');
    expect(r.saida, r.saida).not.toContain('CONTEUDO-SINTETICO');
  });
});
