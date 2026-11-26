import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Recibo da rodada de navegador do portão (CISO-52-PUBLICAR, decisão do líder de 25/11/2026: "Recibo
 * do teste (Recomendado). O teste roda na fila normal e grava um recibo. A publicação recusa se essas
 * partes mudaram e o recibo não confere. Custa quase nada na hora de publicar.").
 *
 * Partes cobertas: public/api e tests/e2e-portao (CISO-CAD-E2E). "Mudaram" = o hash do conteúdo dessas
 * partes no HEAD é diferente do hash delas na última tag v*. Sem base (nenhuma tag), mudaram.
 * Os testes montam um repositório descartável com tag e rodam o script de verdade; não rodam o portão.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT_FONTE = join(RAIZ, 'scripts/apoio/recibo-navegador.sh');
const PUBLICAR = readFileSync(join(RAIZ, 'scripts/publicar.sh'), 'utf-8');

let tmp: string;
let repo: string;
let pasta: string;

function git(...args: string[]): string {
  const r = spawnSync(
    'git',
    [
      '-C',
      repo,
      '-c',
      'user.name=teste',
      '-c',
      'user.email=teste@example.invalid',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'tag.gpgsign=false',
      ...args
    ],
    { encoding: 'utf-8' }
  );
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}

function escrever(caminho: string, conteudo: string): void {
  const completo = join(repo, caminho);
  mkdirSync(dirname(completo), { recursive: true });
  writeFileSync(completo, conteudo);
}

function commit(mensagem: string): void {
  git('add', '-A');
  git('commit', '-q', '-m', mensagem);
}

function script(modo: string): { status: number | null; saida: string } {
  const r = spawnSync('bash', [join(repo, 'scripts/apoio/recibo-navegador.sh'), modo], {
    encoding: 'utf-8',
    env: { ...process.env, RECIBO_PASTA: pasta }
  });
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

/** Hash das partes no HEAD, como o próprio script o calcula (modo "hash"). */
function hashAtual(): string {
  const r = script('hash');
  expect(r.status, r.saida).toBe(0);
  return r.saida.trim();
}

function gravarRecibo(partes: string, resultado = 'verde'): void {
  mkdirSync(pasta, { recursive: true, mode: 0o700 });
  writeFileSync(
    join(pasta, 'navegador.recibo'),
    `sha=${git('rev-parse', 'HEAD')}\npartes=${partes}\nresultado=${resultado}\n`
  );
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-recibo-'));
  repo = join(tmp, 'repo');
  pasta = join(tmp, 'recibos');
  mkdirSync(repo);
  git('init', '-q', '-b', 'main');
  mkdirSync(join(repo, 'scripts/apoio'), { recursive: true });
  copyFileSync(SCRIPT_FONTE, join(repo, 'scripts/apoio/recibo-navegador.sh'));
  escrever('public/api/convite.php', '<?php // v1');
  escrever('tests/e2e-portao/convite.spec.ts', '// v1');
  escrever('src/conteudo.txt', 'texto v1');
  commit('base');
  git('tag', '-a', 'v1.0.0', '-m', 'versão 1.0.0');
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('recibo da rodada de navegador (CISO-52-PUBLICAR)', () => {
  it('partes mudaram e não há recibo: recusa, e a mensagem diz o comando a rodar', () => {
    escrever('public/api/convite.php', '<?php // v2');
    commit('mudança na API');
    const r = script('conferir');
    expect(r.status).toBe(1);
    expect(r.saida).toContain('scripts/apoio/recibo-navegador.sh gravar');
    expect(r.saida).toContain('pesado');
  });

  it('partes mudaram e o recibo tem o hash velho: recusa', () => {
    const antes = hashAtual();
    escrever('tests/e2e-portao/convite.spec.ts', '// v2');
    commit('mudança no e2e');
    gravarRecibo(antes);
    const r = script('conferir');
    expect(r.status).toBe(1);
    expect(r.saida).toContain('não confere');
  });

  it('partes mudaram, recibo com o hash atual mas resultado que não é verde: recusa', () => {
    escrever('public/api/convite.php', '<?php // v2');
    commit('mudança na API');
    gravarRecibo(hashAtual(), 'vermelho');
    expect(script('conferir').status).toBe(1);
  });

  it('partes mudaram e o recibo confere (hash atual e verde): passa', () => {
    escrever('public/api/convite.php', '<?php // v2');
    commit('mudança na API');
    gravarRecibo(hashAtual());
    const r = script('conferir');
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('confere');
  });

  it('partes intactas desde a última tag, mesmo sem recibo: passa', () => {
    escrever('src/conteudo.txt', 'texto v2, fora das partes');
    commit('mudança fora das partes');
    const r = script('conferir');
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('intactas');
  });

  it('sem nenhuma tag v* não há base: as partes contam como mudadas, sem recibo recusa', () => {
    git('tag', '-d', 'v1.0.0');
    const r = script('conferir');
    expect(r.status).toBe(1);
  });

  it('o recibo guarda o SHA testado, o hash das partes e o resultado, e não fica no repositório', () => {
    const r = script('hash');
    expect(r.status).toBe(0);
    const caminho = script('caminho');
    expect(caminho.status).toBe(0);
    expect(caminho.saida.trim().startsWith(pasta)).toBe(true);
    expect(caminho.saida.trim().startsWith(repo)).toBe(false);
  });
});

describe('publicar exige o recibo (ponto de chamada)', () => {
  it('a função do publicar recusa com o recibo ausente e passa com o recibo certo', () => {
    const corpo = PUBLICAR.match(/^conferir_recibo_navegador\(\) \{[\s\S]*?^\}/m)?.[0];
    expect(corpo, 'conferir_recibo_navegador precisa existir em publicar.sh').toBeDefined();
    escrever('public/api/convite.php', '<?php // v2');
    commit('mudança na API');
    const chamada = (): { status: number | null; saida: string } => {
      const r = spawnSync(
        'bash',
        [
          '-c',
          [
            'set -euo pipefail',
            'recusar() { echo "publicar: RECUSADO: $*" >&2; exit 1; }',
            `RAIZ='${repo}'`,
            `PASTA_PACOTES='${tmp}'`,
            corpo,
            'conferir_recibo_navegador',
            'echo passou'
          ].join('\n')
        ],
        { encoding: 'utf-8', env: { ...process.env, RECIBO_PASTA: pasta } }
      );
      return { status: r.status, saida: `${r.stdout}${r.stderr}` };
    };
    const sem = chamada();
    expect(sem.status).toBe(1);
    expect(sem.saida).toContain('RECUSADO');
    gravarRecibo(hashAtual());
    const com = chamada();
    expect(com.status, com.saida).toBe(0);
    expect(com.saida).toContain('passou');
  });

  it('o publicar chama o recibo no fluxo normal e no --preparar, antes de qualquer escrita', () => {
    const principal = PUBLICAR.match(/^principal\(\) \{[\s\S]*?^\}/m)?.[0] ?? '';
    const posRecibo = principal.indexOf('conferir_recibo_navegador');
    expect(posRecibo).toBeGreaterThan(-1);
    expect(posRecibo).toBeLessThan(principal.indexOf('marcar_em_andamento'));
    expect(posRecibo).toBeLessThan(principal.indexOf('preparar_clone'));
  });
});
