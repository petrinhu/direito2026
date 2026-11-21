import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh, opção --novidade (AV-F5, docs/publicacao.md, "Aviso de versão nova").
 * Cada função é extraída do script, sem rodar o publicar inteiro e sem ssh: o repositório e o
 * destino são temporários. Os textos e termos são sintéticos (VERIFICAR_PROIBICOES_TERMOS).
 * PUBLICAR_SCRIPT permite apontar para uma cópia sabotada (prova de estreia, L-36/L-27).
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PUBLICAR = process.env.PUBLICAR_SCRIPT ?? join(RAIZ, 'scripts/publicar.sh');
const FONTE = readFileSync(PUBLICAR, 'utf-8');
const BASE_TEMP = process.env.TMPDIR ?? '/var/tmp';
const TIMEOUT = 60_000;

const TEXTO_USABILIDADE = 'usabilidade:aviso quando o site for atualizado';
const TRAVESSAO = '—';

let tmp: string;
let termos: string;

function funcao(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  if (!m) throw new Error(`função ${nome} não encontrada em publicar.sh`);
  return m[0];
}

const FUNCOES = [
  'recusar',
  'validar_novidades_publicacao',
  'gravar_entrada_novidades',
  'gravar_e_commitar',
  'conferir_historico_pacote',
  'comando_quarentena'
];

function arranjo(valores: Record<string, string | string[]>): string {
  return Object.entries(valores)
    .map(([nome, v]) => {
      if (Array.isArray(v)) {
        return `${nome}=(${v.map((x) => `'${x.replace(/'/g, "'\\''")}'`).join(' ')})`;
      }
      return `${nome}='${v.replace(/'/g, "'\\''")}'`;
    })
    .join('\n');
}

/** Roda um trecho com as funções do publicar.sh e as variáveis dadas, dentro de `cwd`. */
function rodar(
  corpo: string,
  cwd: string,
  valores: Record<string, string | string[]> = {}
): { status: number | null; saida: string } {
  const script = [
    'set -euo pipefail',
    ...FUNCOES.map(funcao),
    arranjo({ RAIZ, CODIGO: RAIZ, ESPACO: tmp, ...valores }),
    corpo,
    'echo passou'
  ].join('\n');
  const r = spawnSync('bash', ['-c', script], {
    cwd,
    encoding: 'utf-8',
    env: {
      ...process.env,
      VERIFICAR_PROIBICOES_TERMOS: termos,
      GIT_AUTHOR_NAME: 'teste',
      GIT_AUTHOR_EMAIL: 'teste@example.com',
      GIT_COMMITTER_NAME: 'teste',
      GIT_COMMITTER_EMAIL: 'teste@example.com'
    }
  });
  return { status: r.status, saida: `${r.stdout}${r.stderr}` };
}

/** Identidade só do repositório temporário, passada por -c: a config global da máquina não entra. */
function git(cwd: string, ...args: string[]): string {
  const r = spawnSync(
    'git',
    ['-c', 'user.name=teste', '-c', 'user.email=teste@example.com', ...args],
    { cwd, encoding: 'utf-8' }
  );
  if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
}

/** Repositório temporário com um commit (package.json 1.12.0.0 e novidades vazias). */
function repositorioTemporario(): string {
  const repo = join(tmp, 'repo');
  mkdirSync(join(repo, 'docs/versoes'), { recursive: true });
  writeFileSync(join(repo, 'package.json'), '{\n  "name": "teste",\n  "version": "1.12.0.0"\n}\n');
  writeFileSync(join(repo, 'docs/versoes/novidades.json'), '{"versoes": []}\n');
  symlinkSync(join(RAIZ, 'node_modules'), join(repo, 'node_modules'));
  git(repo, 'init', '-q', '-b', 'main');
  git(repo, 'add', '.');
  git(repo, 'commit', '-q', '-m', 'chore: base');
  return repo;
}

beforeEach(() => {
  tmp = mkdtempSync(join(BASE_TEMP, 'publicar-novidades-'));
  termos = join(tmp, 'termos.txt');
  writeFileSync(termos, 'termosintetico\n');
  // O tsx é resolvido a partir do cwd: a pasta temporária também enxerga o node_modules real.
  symlinkSync(join(RAIZ, 'node_modules'), join(tmp, 'node_modules'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('--novidade: recusa antes do commit e texto final (AV-F5)', () => {
  it(
    'recurso sem --novidade recusa e manda informar uma',
    () => {
      const r = rodar('TIPO=recurso\nNOVIDADES=()\nvalidar_novidades_publicacao', tmp, {});
      expect(r.status).toBe(1);
      expect(r.saida).toContain('--novidade');
      expect(r.saida).not.toContain('passou');
    },
    TIMEOUT
  );

  it(
    'correcao sem --novidade recusa',
    () => {
      const r = rodar('TIPO=correcao\nNOVIDADES=()\nvalidar_novidades_publicacao', tmp, {});
      expect(r.status).toBe(1);
      expect(r.saida).toContain('--novidade');
    },
    TIMEOUT
  );

  it(
    'novidade inválida (travessão) recusa, sem commit e sem tag',
    () => {
      const repo = repositorioTemporario();
      const antes = git(repo, 'rev-list', '--count', 'HEAD');
      const r = rodar('TIPO=recurso\nvalidar_novidades_publicacao', repo, {
        NOVIDADES: [`usabilidade:rádio ${TRAVESSAO} estudar`]
      });
      expect(r.status).toBe(1);
      expect(r.saida).toContain('usabilidade');
      expect(r.saida).toContain('RECUSADO');
      expect(r.saida).not.toContain('passou');
      expect(git(repo, 'rev-list', '--count', 'HEAD')).toBe(antes);
      expect(git(repo, 'tag', '--list').trim()).toBe('');
    },
    TIMEOUT
  );

  it(
    'construcao com --novidade recusa antes do commit',
    () => {
      const r = rodar('TIPO=construcao\nvalidar_novidades_publicacao', tmp, {
        NOVIDADES: ['tecnica']
      });
      expect(r.status).toBe(1);
      expect(r.saida).toContain('construcao');
      expect(r.saida).not.toContain('passou');
    },
    TIMEOUT
  );

  it(
    'construcao sem --novidade grava tecnica',
    () => {
      const r = rodar(
        'TIPO=construcao\nNOVIDADES=()\nvalidar_novidades_publicacao\necho "ITENS=${ITENS_NOVIDADE[*]}"',
        tmp,
        {}
      );
      expect(r.status, r.saida).toBe(0);
      expect(r.saida).toContain('ITENS=tecnica');
    },
    TIMEOUT
  );

  it(
    'recurso válido mostra o texto final e não altera o repositório (--seco)',
    () => {
      const repo = repositorioTemporario();
      const cabeca = git(repo, 'rev-parse', 'HEAD');
      const r = rodar('TIPO=recurso\nvalidar_novidades_publicacao', repo, {
        NOVIDADES: [TEXTO_USABILIDADE]
      });
      expect(r.status, r.saida).toBe(0);
      expect(r.saida).toContain('Novo: aviso quando o site for atualizado');
      expect(git(repo, 'rev-parse', 'HEAD')).toBe(cabeca);
      expect(git(repo, 'status', '--porcelain').trim()).toBe('');
    },
    TIMEOUT
  );
});

describe('commit de release e histórico do pacote (AV-F5)', () => {
  it(
    'commit de release leva package.json e docs/versoes/novidades.json, copiados do clone do preci, com a entrada da versão',
    () => {
      const repo = repositorioTemporario();
      const clone = join(tmp, 'clone');
      const r = rodar(
        [
          'BASE="$(git rev-parse HEAD)"',
          `CLONE='${clone}'`,
          'git clone -q "$RAIZ" "$CLONE"',
          '(cd "$CODIGO" && node --import tsx "$CODIGO/scripts/apoio/versao-cli.ts" gravar "$CLONE/package.json" "$VERSAO_NOVA") >/dev/null',
          'gravar_entrada_novidades',
          'gravar_e_commitar',
          'git show --stat --format=%s HEAD'
        ].join('\n'),
        repo,
        {
          // RAIZ do script aponta para o repositório temporário: nunca para a árvore real.
          RAIZ: repo,
          TIPO: 'recurso',
          VERSAO_ATUAL: '1.12.0.0',
          VERSAO_NOVA: '1.13.0.0',
          PACKAGE_ALTERADO: '0',
          RELEASE_FEITO: '0',
          ITENS_NOVIDADE: [TEXTO_USABILIDADE, 'tecnica']
        }
      );
      expect(r.status, r.saida).toBe(0);
      const stat = git(repo, 'show', '--stat', '--format=%s', 'HEAD');
      expect(stat).toContain('chore(release): v1.13.0.0');
      expect(stat).toContain('package.json');
      expect(stat).toContain('docs/versoes/novidades.json');
      expect(stat).toContain('2 files changed');
      const novidades = JSON.parse(
        readFileSync(join(repo, 'docs/versoes/novidades.json'), 'utf-8')
      );
      expect(novidades.versoes[0]).toEqual({
        versao: '1.13.0.0',
        novidades: [TEXTO_USABILIDADE, 'tecnica']
      });
      // Os bytes da release são os do clone que o preci testou.
      expect(readFileSync(join(repo, 'package.json'))).toEqual(
        readFileSync(join(clone, 'package.json'))
      );
    },
    TIMEOUT
  );

  it(
    'HEAD diferente da base recusa antes de copiar: package.json e novidades da raiz ficam como estavam',
    () => {
      const repo = repositorioTemporario();
      const antes = readFileSync(join(repo, 'package.json'), 'utf-8');
      const r = rodar(
        [
          'BASE=0000000000000000000000000000000000000000',
          `CLONE='${join(tmp, 'clone-inexistente')}'`,
          'gravar_e_commitar'
        ].join('\n'),
        repo,
        {
          RAIZ: repo,
          TIPO: 'recurso',
          VERSAO_NOVA: '1.13.0.0',
          PACKAGE_ALTERADO: '0',
          RELEASE_FEITO: '0'
        }
      );
      expect(r.status).not.toBe(0);
      expect(r.saida).toContain('HEAD mudou');
      expect(readFileSync(join(repo, 'package.json'), 'utf-8')).toBe(antes);
    },
    TIMEOUT
  );

  it(
    'historico[0] diferente da versão nova recusa (conferência do pacote do clone)',
    () => {
      const clone = join(tmp, 'clone');
      mkdirSync(join(clone, 'dist-pacote/app'), { recursive: true });
      writeFileSync(
        join(clone, 'dist-pacote/app/versao.json'),
        JSON.stringify({ versao: '1.13.0.0', historico: [{ versao: '1.12.0.0', novidades: [] }] })
      );
      const r = rodar(
        "CLONE='" + clone + "'\nVERSAO_NOVA=1.13.0.0\nconferir_historico_pacote",
        tmp,
        {}
      );
      expect(r.status).toBe(1);
      expect(r.saida).toContain('historico');
    },
    TIMEOUT
  );

  it(
    'historico[0] igual à versão nova passa',
    () => {
      const clone = join(tmp, 'clone-ok');
      mkdirSync(join(clone, 'dist-pacote/app'), { recursive: true });
      writeFileSync(
        join(clone, 'dist-pacote/app/versao.json'),
        JSON.stringify({
          versao: '1.13.0.0',
          historico: [{ versao: '1.13.0.0', novidades: ['tecnica'] }]
        })
      );
      const r = rodar(
        "CLONE='" + clone + "'\nVERSAO_NOVA=1.13.0.0\nconferir_historico_pacote",
        tmp,
        {}
      );
      expect(r.status, r.saida).toBe(0);
    },
    TIMEOUT
  );
});

describe('poda vira quarentena, nunca rm (AV-F5, docs/publicacao.md)', () => {
  it(
    'a versão mais velha é MOVIDA para desativadas/<versão>-<data>, com o conteúdo preservado',
    () => {
      const app = join(tmp, 'direito2026_app');
      mkdirSync(join(app, 'versoes/v1.10.0.0'), { recursive: true });
      writeFileSync(join(app, 'versoes/v1.10.0.0/index.html'), 'velha');
      const r = rodar(
        `DESTINO_APP='${app}'\nCMD="$(comando_quarentena 1.10.0.0 20261114)"\nbash -c "$CMD"`,
        tmp,
        {}
      );
      expect(r.status, r.saida).toBe(0);
      expect(readFileSync(join(app, 'desativadas/1.10.0.0-20261114/index.html'), 'utf-8')).toBe(
        'velha'
      );
      expect(() => readFileSync(join(app, 'versoes/v1.10.0.0/index.html'))).toThrow();
    },
    TIMEOUT
  );

  it(
    'o comando da quarentena não contém rm',
    () => {
      const r = rodar(`DESTINO_APP='/x/app'\ncomando_quarentena 1.10.0.0 20261114`, tmp, {});
      expect(r.status, r.saida).toBe(0);
      expect(r.saida).not.toMatch(/\brm\b/);
    },
    TIMEOUT
  );

  it(
    'destino de quarentena já existente recusa e não mexe na versão',
    () => {
      const app = join(tmp, 'app-cheio');
      mkdirSync(join(app, 'versoes/v1.10.0.0'), { recursive: true });
      writeFileSync(join(app, 'versoes/v1.10.0.0/index.html'), 'velha');
      mkdirSync(join(app, 'desativadas/1.10.0.0-20261114'), { recursive: true });
      const r = rodar(
        `DESTINO_APP='${app}'\nCMD="$(comando_quarentena 1.10.0.0 20261114)"\nbash -c "$CMD"`,
        tmp,
        {}
      );
      expect(r.status).not.toBe(0);
      expect(readFileSync(join(app, 'versoes/v1.10.0.0/index.html'), 'utf-8')).toBe('velha');
    },
    TIMEOUT
  );
});
