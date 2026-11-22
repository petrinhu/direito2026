import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import {
  CONFIGS_DA_RAIZ,
  PACOTE_REAL_FILTRO,
  coletarReferencias,
  planejar,
  referenciasDoSpec
} from '../../scripts/apoio/preciSeletivo';
import { join, resolve } from 'node:path';

/**
 * PRECI-SELETIVO: a classificação dos arquivos mudados decide quais passos seletivos do preci
 * rodam. Cada caso fixa uma decisão que, se errar, ou deixa de checar algo que a mudança tocou
 * (afrouxa o portão), ou roda à toa. Os passos de segurança (cifra, partição, travessão, build,
 * varreduras do dist) não passam por aqui: rodam sempre.
 */

const CARACTERIZACAO = [
  'tests/caracterizacao/curriculo.spec.ts',
  'tests/caracterizacao/indiceBusca.spec.ts'
];
const existeTudo = () => true;

describe('planejar (classificação do preci seletivo)', () => {
  it('só CSS: lint e prettier só no CSS, vitest pulado, vue-tsc roda por estar em src/', () => {
    const p = planejar(['src/ui/tema/tokens.css'], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: existeTudo
    });

    expect(p.completo).toBe(false);
    expect(p.passos.lint).toMatchObject({ roda: false, alvo: null });
    expect(p.passos.prettier).toMatchObject({ roda: true, alvo: ['src/ui/tema/tokens.css'] });
    expect(p.passos.vitest).toMatchObject({ roda: false, alvo: null });
    expect(p.passos.vueTsc.roda).toBe(true);
    expect(p.passos.conteudo.roda).toBe(false);
    expect(p.passos.php.roda).toBe(false);
    expect(p.passos.php.motivo).toBe(
      'pulado: nada em servidor/, public/api/ ou public/.htaccess mudou'
    );
  });

  it('só conteúdo: roda validação, citações e R3 da fonte; vitest inclui tests/caracterizacao inteira', () => {
    const arquivo = 'src/conteudo/p1/intr-direito/u1/resumo.ts';
    const p = planejar([arquivo], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: existeTudo
    });

    expect(p.completo).toBe(false);
    expect(p.passos.conteudo.roda).toBe(true);
    expect(p.passos.lint).toMatchObject({ roda: true, alvo: [arquivo] });
    expect(p.passos.vueTsc.roda).toBe(true);
    expect(p.passos.depcruise.roda).toBe(true);
    expect(p.passos.php.roda).toBe(false);
    const alvo = p.passos.vitest.alvo as string[];
    expect(p.passos.vitest.roda).toBe(true);
    expect(alvo).toEqual(expect.arrayContaining([arquivo, ...CARACTERIZACAO]));
    expect(new Set(alvo).size).toBe(alvo.length);
  });

  it('servidor: só a suíte PHP roda; o resto dos seletivos fica pulado', () => {
    const p = planejar(['servidor/api/portao.php'], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: existeTudo
    });

    expect(p.completo).toBe(false);
    expect(p.passos.php.roda).toBe(true);
    expect(p.passos.lint.roda).toBe(false);
    expect(p.passos.prettier.roda).toBe(false);
    expect(p.passos.vueTsc.roda).toBe(false);
    expect(p.passos.depcruise.roda).toBe(false);
    expect(p.passos.vitest.roda).toBe(false);
    expect(p.passos.conteudo.roda).toBe(false);
  });

  it('scripts/ muda: completo, com o motivo nomeando o arquivo', () => {
    const p = planejar(['scripts/preci.sh'], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: existeTudo
    });

    expect(p.completo).toBe(true);
    expect(p.motivo).toContain('scripts/preci.sh');
    for (const passo of Object.values(p.passos)) {
      expect(passo.roda).toBe(true);
      expect(passo.alvo).toBe('todos');
    }
  });

  it('lista vazia: nenhum seletivo roda, sem completo', () => {
    const p = planejar([], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: existeTudo
    });

    expect(p.completo).toBe(false);
    for (const passo of Object.values(p.passos)) {
      expect(passo.roda).toBe(false);
    }
  });

  it('completo sem seleção: sem tag base, ou PRECI_COMPLETO=1, ou gatilho de config/teste compartilhado', () => {
    expect(planejar(['src/ui/x.css'], { base: null, existe: existeTudo }).completo).toBe(true);
    expect(
      planejar(['src/ui/x.css'], { base: 'v1.18.3.0', completoForcado: true, existe: existeTudo })
        .completo
    ).toBe(true);
    for (const gatilho of [
      'package.json',
      'package-lock.json',
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.portao.config.ts',
      'tsconfig.app.json',
      '.dependency-cruiser.cjs',
      'tests/apoio/setupVitest.ts'
    ]) {
      expect(planejar([gatilho], { base: 'v1.18.3.0', existe: existeTudo }).completo, gatilho).toBe(
        true
      );
    }
  });

  it('arquivo apagado conta para a classificação, mas não entra no lint nem no vitest', () => {
    const apagado = 'src/conteudo/p1/x/u1/resumo.ts';
    const p = planejar([apagado], {
      base: 'v1.18.3.0',
      caracterizacao: CARACTERIZACAO,
      existe: (caminho) => caminho !== apagado
    });

    expect(p.passos.conteudo.roda).toBe(true);
    expect(p.passos.lint.roda).toBe(false);
    expect(p.passos.vitest.alvo).toEqual(CARACTERIZACAO);
  });
});

describe('build e build:construir (o preci chama a metade)', () => {
  it('build:construir é o final de build: a metade que o preci roda não diverge do build completo', () => {
    const scripts = (
      JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')) as {
        scripts: Record<string, string>;
      }
    ).scripts;
    const build = scripts['build'] ?? '';
    const construir = scripts['build:construir'] ?? '';
    expect(build).not.toBe('');
    expect(construir).not.toBe('');
    expect(build.endsWith(construir)).toBe(true);
  });
});

// ---- Aresta por texto (PRECI-SELETIVO-GRAFO): spec que lê arquivo-fonte com readFileSync ----

const RAIZ = resolve(__dirname, '../..');

/**
 * Arquivos do diff v1.18.21.0..v1.18.22.0 (o furo), sem o package.json (o bump de versão) e sem
 * eslint.config.js: PRECI-CONFIG-PACOTE (1.18.28.0) fez essa config ligar o modo completo, então
 * o diff dela não cabe mais no caso "seletivo"; o caso do selo compacto continua coberto aqui.
 */
const FURO_1_18_22 = [
  'docs/versoes/novidades.json',
  'public/api/nucleo/telas.php',
  'servidor/testes/portao-pacote.teste.php',
  'servidor/testes/portao.teste.php',
  'src/App.vue',
  'src/app/chaves.ts',
  'src/app/radio/tocadorRadio.ts',
  'src/core/radio/catalogo.ts',
  'src/core/radio/maquina.ts',
  'src/core/radio/preferencias.ts',
  'src/dados/versoes/historico.json',
  'src/main.ts',
  'src/ui/componentes/TocadorRadio.vue',
  'src/ui/layout/BarraTopo.vue',
  'tests/componente/App.radioSairApagaConsentimento.spec.ts',
  'tests/e2e-portao/radio.spec.ts',
  'tests/unidade/radio.catalogo.spec.ts',
  'tests/unidade/radio.maquina.spec.ts',
  'tests/unidade/radio.preferencias.spec.ts',
  'tests/unidade/radio.tocadorRadio.spec.ts'
];
const SELO_COMPACTO = 'tests/componente/BarraTopo.seloCompacto.spec.ts';

describe('aresta por texto (referenciasDoSpec e coletarReferencias)', () => {
  it('resolve caminho relativo à pasta do spec e também relativo à raiz', () => {
    const refs = referenciasDoSpec(
      'tests/componente/x.spec.ts',
      "readFileSync(resolve(__dirname, '../../src/ui/layout/BarraTopo.vue'));\nreadFileSync('src/ui/estilos/tokens.css');"
    );
    expect(refs).toContain('src/ui/layout/BarraTopo.vue');
    expect(refs).toContain('src/ui/estilos/tokens.css');
  });

  it('.md citado não é dependência (comentário ou fixture de repo temporário)', () => {
    expect(
      referenciasDoSpec('tests/unidade/x.spec.ts', "writeFileSync(join(raiz, 'README.md'), 'x');")
    ).toEqual([]);
  });

  it('ignora literal sem barra e sem extensão (texto de teste, nome de caso)', () => {
    const refs = referenciasDoSpec(
      'tests/unidade/x.spec.ts',
      "it('o selo fica na barra', () => {})"
    );
    expect(refs).toEqual([]);
  });

  it('o spec do selo compacto cita BarraTopo.vue (o caminho que o furo deixou passar)', () => {
    const { referencias } = coletarReferencias(RAIZ);
    expect(referencias.get(SELO_COMPACTO)).toContain('src/ui/layout/BarraTopo.vue');
  });
});

describe('planejar com a aresta por texto (o furo e a regra de docs)', () => {
  it('o diff do furo (1.18.22.0, sem o bump de versão) seleciona BarraTopo.seloCompacto.spec.ts', () => {
    const { referencias, sempreRodar } = coletarReferencias(RAIZ);
    const p = planejar(FURO_1_18_22, {
      base: 'v1.18.21.0',
      caracterizacao: [],
      existe: (c) => existsSync(join(RAIZ, c)),
      referencias,
      sempreRodar
    });
    expect(p.completo).toBe(false);
    expect(p.passos.vitest.roda).toBe(true);
    expect(p.passos.vitest.alvo).toContain(SELO_COMPACTO);
  });

  it('diff só de docs não seleciona nenhum passo', () => {
    const { referencias, sempreRodar } = coletarReferencias(RAIZ);
    const p = planejar(['docs/arquitetura.md', 'docs/publicacao.md', 'README.md'], {
      base: 'v1.18.21.0',
      caracterizacao: [],
      existe: (c) => existsSync(join(RAIZ, c)),
      referencias,
      sempreRodar
    });
    expect(p.completo).toBe(false);
    for (const [nome, passo] of Object.entries(p.passos)) {
      expect(passo.roda, nome).toBe(false);
    }
  });

  it('CSS que um spec lê por fs (tokens.css) seleciona esse spec, mesmo sem import', () => {
    const p = planejar(['src/ui/estilos/tokens.css'], {
      base: 'v1.18.21.0',
      caracterizacao: [],
      existe: () => true,
      referencias: new Map([
        ['tests/unidade/design.contrasteTokens.spec.ts', ['src/ui/estilos/tokens.css']]
      ])
    });
    expect(p.passos.vitest.alvo).toEqual(['tests/unidade/design.contrasteTokens.spec.ts']);
  });

  it('pasta citada seleciona o spec que mudou dentro dela (referência a diretório)', () => {
    const p = planejar(['src/ui/layout/BarraTopo.vue'], {
      base: 'v1.18.21.0',
      caracterizacao: [],
      existe: () => true,
      referencias: new Map([['tests/componente/x.spec.ts', ['src/ui/layout']]])
    });
    expect(p.passos.vitest.alvo).toEqual(expect.arrayContaining(['tests/componente/x.spec.ts']));
  });

  it('spec que roda sempre entra com mudança em src/ ou tests/, e não com docs só', () => {
    const sempre = ['tests/unidade/sempre.spec.ts'];
    const comCodigo = planejar(['src/core/x.ts'], {
      base: 'v1.18.21.0',
      caracterizacao: [],
      existe: () => true,
      sempreRodar: sempre
    });
    expect(comCodigo.passos.vitest.alvo).toEqual(expect.arrayContaining(sempre));
    const soDocs = planejar(['docs/arquitetura.md'], {
      base: 'v1.18.21.0',
      caracterizacao: [],
      existe: () => true,
      sempreRodar: sempre
    });
    expect(soDocs.passos.vitest.roda).toBe(false);
  });

  it('docs/*.md não é mais gatilho de conteúdo; o prettier ignora *.md (.prettierignore)', () => {
    const p = planejar(['docs/arquitetura.md'], {
      base: 'v1.18.21.0',
      caracterizacao: [],
      existe: () => true
    });
    expect(p.passos.conteudo.roda).toBe(false);
    expect(p.passos.prettier.roda).toBe(false);
  });
});

describe('formas de citar caminho (join, template, pasta montada)', () => {
  it('resolve(RAIZ, segmentos) de um arquivo vira o caminho inteiro do arquivo', () => {
    expect(
      referenciasDoSpec(
        'tests/componente/x.spec.ts',
        "readFileSync(resolve(RAIZ, 'src', 'ui', 'Barra.vue'))"
      )
    ).toContain('src/ui/Barra.vue');
  });

  it("pasta montada por segmentos não vira prefixo (join(raiz, 'docs') não casa com docs/x.md)", () => {
    const refs = referenciasDoSpec('tests/unidade/x.spec.ts', "join(raiz, 'docs')");
    expect(refs).not.toContain('docs');
  });

  it('template com ${} conta o que vem depois do ${}', () => {
    expect(
      referenciasDoSpec('tests/unidade/x.spec.ts', 'readFileSync(`${RAIZ}/src/estilos/x.css`)')
    ).toContain('src/estilos/x.css');
  });
});

// ---- PRECI-CONFIG-PACOTE: configs da raiz ligam o modo completo; o portão de pacote real é sempre ----

describe('configs da raiz (PRECI-CONFIG-PACOTE)', () => {
  const base = { base: 'v1.18.28.0', existe: existeTudo, caracterizacao: CARACTERIZACAO };

  it('mudar só .prettierrc.json liga o modo completo, nomeando o arquivo', () => {
    const p = planejar(['.prettierrc.json'], base);
    expect(p.completo).toBe(true);
    expect(p.motivo).toContain('.prettierrc.json');
    for (const passo of Object.values(p.passos)) {
      expect(passo.roda).toBe(true);
      expect(passo.alvo).toBe('todos');
    }
  });

  it('mudar só eslint.config.js liga o modo completo (o furo de 1.18.28.0)', () => {
    const p = planejar(['eslint.config.js'], base);
    expect(p.completo).toBe(true);
    expect(p.motivo).toContain('eslint.config.js');
  });

  it('cada entrada da lista explícita liga o modo completo, e cada uma existe na raiz', () => {
    expect(CONFIGS_DA_RAIZ.length).toBeGreaterThan(0);
    for (const arquivo of CONFIGS_DA_RAIZ) {
      expect(existsSync(join(RAIZ, arquivo)), `existe na raiz: ${arquivo}`).toBe(true);
      expect(planejar([arquivo], base).completo, arquivo).toBe(true);
    }
  });

  it('todo arquivo de configuração que existe na raiz liga o completo (dotfile, .json, .cjs, *.config.*)', () => {
    const configs = readdirSync(RAIZ).filter(
      (n) =>
        existsSync(join(RAIZ, n)) &&
        /^\.|\.(json|cjs|mjs)$|\.config\.[cm]?[jt]s$/.test(n) &&
        !n.startsWith('.worktrees')
    );
    expect(configs.length).toBeGreaterThan(0);
    for (const n of configs) {
      expect(planejar([n], base).completo, n).toBe(true);
    }
  });

  it('documento da raiz (README, TODO, CLAUDE) não liga o completo', () => {
    for (const n of ['README.md', 'TODO.md', 'CLAUDE.md']) {
      expect(planejar([n], base).completo, n).toBe(false);
    }
  });

  it('nunca há arquivo de configuração em subpasta que vire completo por nome de raiz', () => {
    expect(planejar(['src/.prettierrc.json'], base).completo).toBe(false);
  });
});

describe('portão de pacote real (sempre roda, mesmo sem a suíte PHP)', () => {
  it('diff só de conteúdo: pacoteReal roda, a suíte PHP é pulada', () => {
    const p = planejar(['src/conteudo/p1/intr-direito/u1/resumo.ts'], {
      base: 'v1.18.28.0',
      caracterizacao: CARACTERIZACAO,
      existe: existeTudo
    });
    expect(p.passos.php.roda).toBe(false);
    expect(p.pacoteReal.roda).toBe(true);
  });

  it('vale para toda forma de plano: vazio, só CSS, servidor, completo', () => {
    const casos = [
      planejar([], { base: 'v1.18.28.0', existe: existeTudo }),
      planejar(['src/ui/tema/tokens.css'], { base: 'v1.18.28.0', existe: existeTudo }),
      planejar(['servidor/api/portao.php'], { base: 'v1.18.28.0', existe: existeTudo }),
      planejar(['scripts/preci.sh'], { base: 'v1.18.28.0', existe: existeTudo }),
      planejar(['src/ui/x.css'], { base: null, existe: existeTudo })
    ];
    for (const p of casos) {
      expect(p.pacoteReal.roda).toBe(true);
    }
  });

  it('todo teste(...) de portao-pacote.teste.php tem o filtro, senão o rodar.php o deixa de fora', () => {
    const fonte = readFileSync(join(RAIZ, 'servidor/testes/portao-pacote.teste.php'), 'utf8');
    const nomes = [...fonte.matchAll(/^teste\('([^']*)'/gm)].map((m) => m[1] ?? '');
    expect(nomes.length).toBeGreaterThan(0);
    for (const nome of nomes) {
      expect(nome, nome).toContain(PACOTE_REAL_FILTRO);
    }
  });

  it('a saída do CLI (o que o preci.sh faz eval) carrega o portão para um diff só de conteúdo', () => {
    const pasta = mkdtempSync(join(tmpdir(), 'preci-config-'));
    const lista = join(pasta, 'arquivos.txt');
    writeFileSync(lista, 'src/conteudo/p1/intr-direito/u1/resumo.ts\n');
    const saida = execFileSync(
      'node',
      [
        '--import',
        'tsx',
        'scripts/apoio/preciSeletivo.ts',
        '--base',
        'v1.18.28.0',
        '--arquivos',
        lista
      ],
      { cwd: RAIZ, encoding: 'utf8' }
    );
    expect(saida).toContain('PRECI_PHP_RODA=0');
    expect(saida).toContain('PRECI_PACOTE_REAL_RODA=1');
    expect(saida).toContain(`PRECI_PACOTE_REAL_FILTRO='${PACOTE_REAL_FILTRO}'`);
    // tsx sobe em processo novo: sob carga passa do teto padrão de 5 s do vitest.
  }, 30_000);

  it('o preci.sh roda o grupo pacote real, com o filtro vindo do plano, fora do if da suíte', () => {
    const preci = readFileSync(join(RAIZ, 'scripts/preci.sh'), 'utf8');
    expect(preci).toContain('"$PRECI_PACOTE_REAL_FILTRO"');
    expect(preci).toMatch(
      /pular "suíte PHP[^\n]*\n\s*if \[ "\$PRECI_PACOTE_REAL_RODA" = 1 \]; then\n\s*passo "portão de pacote real/
    );
  });
});
