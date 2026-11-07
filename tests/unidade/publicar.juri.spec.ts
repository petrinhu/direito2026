import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh e a Júri. Três provas, sem tocar o servidor:
 * (1) a conferência pós-deploy reprova se api/juri/conteudo.php não responder
 * 401 sem sessão (função extraída do próprio script, com curl falso no PATH);
 * (2) as regras de proteção do rsync seguram acervo.json e imagens/ no destino
 * (simulação `rsync -n`, sem escrever nada); (3) o diretório privado da Júri
 * fica fora do destino do rsync, pela mesma derivação de config.php.
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

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'publicar-juri-'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('publicar.sh e a Júri', () => {
  it('o script continua com sintaxe válida', () => {
    const r = spawnSync('bash', ['-n', PUBLICAR], { encoding: 'utf-8' });
    expect(r.status, r.stderr).toBe(0);
  });

  describe('conferência pós-deploy', () => {
    function conferirComCodigoJuri(codigoJuri: string) {
      const binarios = join(tmp, 'bin');
      mkdirSync(binarios);
      // curl falso: a URL é o último argumento; devolve o código HTTP quando
      // pedido com -w, o corpo nos demais casos.
      writeFileSync(
        join(binarios, 'curl'),
        [
          '#!/usr/bin/env bash',
          'url="${@: -1}"',
          'case "$url" in',
          '  */api/juri/conteudo.php) codigo="$CODIGO_JURI" ;;',
          '  */api/conteudo.php) codigo=401 ;;',
          "  */api/saude.php) printf '%s' '{\"ok\":true}'; exit 0 ;;",
          "  *) printf 'pagina'; exit 0 ;;",
          'esac',
          'printf \'%s\' "$codigo"',
          ''
        ].join('\n'),
        { mode: 0o755 }
      );
      return spawnSync(
        'bash',
        [
          '-c',
          [
            'set -euo pipefail',
            funcao('conferir_api_e_raiz'),
            'DOMINIO=https://teste.invalido',
            'RAIZ_PRINCIPAL=https://raiz.invalido/',
            'MD5_RAIZ_PRINCIPAL=000000000000',
            'DIVERGENCIAS=0',
            'conferir_api_e_raiz',
            'echo "DIVERGENCIAS=$DIVERGENCIAS"'
          ].join('\n')
        ],
        {
          encoding: 'utf-8',
          env: { ...process.env, PATH: `${binarios}:${process.env.PATH}`, CODIGO_JURI: codigoJuri }
        }
      );
    }

    it('api/juri/conteudo.php que responde 401 sem sessão passa', () => {
      const r = conferirComCodigoJuri('401');
      expect(r.stdout).toContain('[PASSOU] api/juri/conteudo.php responde 401 sem sessão');
    });

    it('api/juri/conteudo.php que responde 200 sem sessão reprova (dado do júri exposto)', () => {
      const r = conferirComCodigoJuri('200');
      expect(r.stderr).toContain('[DIVERGE] api/juri/conteudo.php respondeu 200, esperado 401');
      expect(r.stdout).not.toContain('api/juri/conteudo.php responde 401');
    });
  });

  describe('regras de proteção do rsync', () => {
    function regrasNoArquivo(): string {
      const r = spawnSync(
        'bash',
        ['-c', `set -euo pipefail\n${funcao('regras_fixas_protecao')}\nregras_fixas_protecao`],
        { encoding: 'utf-8' }
      );
      expect(r.status, r.stderr).toBe(0);
      const caminho = join(tmp, 'protecao.rules');
      writeFileSync(caminho, r.stdout);
      return caminho;
    }

    it('acervo.json e imagens/ do júri não são apagados no destino; o apagamento normal continua funcionando', () => {
      const regras = regrasNoArquivo();
      const origem = join(tmp, 'origem');
      const destino = join(tmp, 'destino');
      mkdirSync(join(origem, 'assets'), { recursive: true });
      writeFileSync(join(origem, 'index.html'), 'x');
      writeFileSync(join(origem, 'assets', 'app.js'), 'x');
      mkdirSync(join(destino, 'assets'), { recursive: true });
      mkdirSync(join(destino, 'imagens'), { recursive: true });
      for (const nome of [
        'index.html',
        'assets/app.js',
        'assets/velho.js',
        'acervo.json',
        'imagens/abc.juri',
        'usuarios.json'
      ]) {
        writeFileSync(join(destino, nome), 'x');
      }

      const r = spawnSync(
        'rsync',
        [
          '-n',
          '-i',
          '-rlt',
          '--checksum',
          '--delete',
          `--filter=. ${regras}`,
          `${origem}/`,
          `${destino}/`
        ],
        { encoding: 'utf-8' }
      );
      expect(r.status, r.stderr).toBe(0);
      const apagaria = r.stdout
        .split('\n')
        .map((linha) => linha.match(/\*deleting\s+(.+)$/)?.[1])
        .filter((caminho): caminho is string => caminho !== undefined);

      // Controle: o apagamento normal existe nesta simulação (senão o teste não prova nada).
      expect(apagaria).toContain('assets/velho.js');
      expect(apagaria).not.toContain('acervo.json');
      expect(apagaria.some((caminho) => caminho.startsWith('imagens'))).toBe(false);
      expect(apagaria).not.toContain('usuarios.json');
    });
  });

  it('o diretório privado da Júri fica fora do destino do rsync (derivação de config.php)', () => {
    // LU-F4.3: o destino é a raiz do domínio (padrão de PUBLICAR_DESTINO_RAIZ); o webroot e o app ficam abaixo dela.
    const destinoLinha = FONTE.match(/^DESTINO_RAIZ="\$\{PUBLICAR_DESTINO_RAIZ-([^}]+)\}"$/m)?.[1];
    expect(destinoLinha).toBeDefined();
    const destino = destinoLinha!.replace(/\/+$/, '');
    // config.php: dirname($dirNucleo, 4) . '/' . privNome, com $dirNucleo = <destino>/api/nucleo.
    const privadoDe = (nome: string): string => {
      let base = `${destino}/public_html/direito2026/api/nucleo`;
      for (let i = 0; i < 4; i += 1) base = posix.dirname(base);
      return `${base}/${nome}`;
    };
    // Mesmo cálculo do Interdisciplinar, que docs/publicacao.md documenta como
    // ~/domains/drpetrus.top/direito2026_privado. Se este assert falhar, a derivação está errada.
    expect(privadoDe('direito2026_privado')).toBe('domains/drpetrus.top/direito2026_privado');
    // A Júri antiga é irmã do public_html, sob a mesma raiz. O que o script nunca toca é o webroot e o app dela.
    const juriAntiga = privadoDe('juri2026_privado');
    expect(juriAntiga.startsWith(`${destino}/public_html/direito2026/`)).toBe(false);
    expect(juriAntiga.startsWith(`${destino}/direito2026_app/`)).toBe(false);
  });
});

/**
 * O preci roda na caixa (L-50, E9). Sem CADERNO_CAIXA, a publicação real recusa
 * antes de qualquer commit, tag ou clone. Só a função conferir_insumos é extraída,
 * com chave de mentira que existe, para isolar a regra da caixa.
 */
describe('conferir_insumos: o preci só roda na caixa (L-50, E9)', () => {
  function conferirComCaixa(
    caixa: string | undefined,
    modoCaixa: number = 0o755
  ): { status: number | null; saida: string } {
    const chave = join(tmp, 'chave-git-crypt');
    writeFileSync(chave, '');
    const arquivoCaixa = join(tmp, 'caixa.sh');
    writeFileSync(arquivoCaixa, '#!/usr/bin/env bash\nexec "$@"\n', { mode: modoCaixa });
    const ambiente: Record<string, string | undefined> = { ...process.env };
    delete ambiente.CADERNO_CAIXA;
    if (caixa !== undefined) ambiente.CADERNO_CAIXA = caixa === '' ? '' : arquivoCaixa;
    const r = spawnSync(
      'bash',
      [
        '-c',
        [
          'set -euo pipefail',
          funcao('recusar'),
          funcao('conferir_insumos'),
          `CHAVE_GIT_CRYPT=${chave}`,
          'conferir_insumos',
          'echo passou'
        ].join('\n')
      ],
      { encoding: 'utf-8', env: ambiente }
    );
    return { status: r.status, saida: `${r.stdout}${r.stderr}` };
  }

  it('sem CADERNO_CAIXA recusa com rc 1 e a mensagem diz como passar a caixa', () => {
    const r = conferirComCaixa(undefined);
    expect(r.status, r.saida).toBe(1);
    expect(r.saida).toContain('CADERNO_CAIXA');
    expect(r.saida).toContain('L-50');
    expect(r.saida).not.toContain('passou');
  });

  it('CADERNO_CAIXA vazio recusa do mesmo jeito', () => {
    const r = conferirComCaixa('');
    expect(r.status, r.saida).toBe(1);
    expect(r.saida).not.toContain('passou');
  });

  it('com caixa executável, a conferência passa (rc 0)', () => {
    const r = conferirComCaixa('caixa');
    expect(r.status, r.saida).toBe(0);
    expect(r.saida).toContain('passou');
  });

  it('caixa que não é executável continua recusada', () => {
    const r = conferirComCaixa('caixa', 0o644);
    expect(r.status).toBe(1);
    expect(r.saida).toContain('não é executável');
  });
});
