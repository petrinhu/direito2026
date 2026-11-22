/**
 * PRECI-SELETIVO: decide, a partir da lista de arquivos mudados desde a última tag publicada,
 * quais passos seletivos do preci rodam. Os passos de segurança (cifra, partição, travessão,
 * build com o portão de pacote publicável, varreduras do dist) não passam por aqui: rodam sempre.
 *
 * Regra de falha: qualquer dúvida vira completo. Sem tag base, com PRECI_COMPLETO=1, ou com
 * mudança em arquivo que afeta o preci inteiro (scripts/, configs, package*.json, tests/apoio),
 * nenhum passo é pulado.
 *
 * Uso (o preci.sh chama assim; saída é atribuição de shell, com valores entre aspas simples):
 *   node --import tsx scripts/apoio/preciSeletivo.ts --base <tag|""> --arquivos <lista> [--completo 0|1]
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, posix, relative } from 'node:path';

export type PassoSeletivo =
  'lint' | 'prettier' | 'vueTsc' | 'depcruise' | 'vitest' | 'conteudo' | 'php';

export interface Decisao {
  roda: boolean;
  /** 'todos' = comando completo, lista = só estes caminhos, null = pulado. */
  alvo: string[] | 'todos' | null;
  motivo: string;
}

export interface Plano {
  completo: boolean;
  motivo: string;
  passos: Record<PassoSeletivo, Decisao>;
}

export interface OpcoesPlano {
  /** Última tag publicada (v*). Vazio ou null = não há base: completo. */
  base: string | null;
  completoForcado?: boolean;
  /** Arquivos de tests/caracterizacao, incluídos inteiros quando src/conteudo muda. */
  caracterizacao?: readonly string[];
  /** Arquivo existe no disco (lint e vitest não recebem arquivo apagado). */
  existe?: (caminho: string) => boolean;
  /**
   * Por spec de vitest, os caminhos do repo que o texto dele cita (ver referenciasDoSpec).
   * Um spec que lê um .vue ou .css com readFileSync não tem aresta no grafo de imports: esta
   * lista é a aresta que falta. Spec cujo caminho citado muda entra no vitest.
   */
  referencias?: ReadonlyMap<string, readonly string[]>;
  /**
   * Specs que leem arquivo por caminho montado em tempo de execução e não citam nenhum
   * caminho existente. Rodam sempre que a mudança toca src/ ou tests/ (regra conservadora).
   */
  sempreRodar?: readonly string[];
}

const EXT_LINT = /\.(ts|tsx|vue|js|mjs|cjs)$/;
// *.md não entra: o .prettierignore já deixa o prettier de fora de todo .md.
const EXT_PRETTIER = /\.(ts|tsx|vue|js|mjs|cjs|json|css|html|ya?ml)$/;
const EXT_VITEST = /\.(ts|tsx|vue|js|mjs)$/;

const ehGatilhoCompleto = (p: string): boolean =>
  p.startsWith('scripts/') ||
  p === 'package.json' ||
  p === 'package-lock.json' ||
  /^(vite|vitest|playwright)(\.[\w-]+)?\.config\.[cm]?[jt]s$/.test(p) ||
  /^tsconfig[\w.-]*\.json$/.test(p) ||
  p.startsWith('.dependency-cruiser') ||
  p.startsWith('tests/apoio/');

// docs/ não entra: nenhum validador do conteúdo (validar-conteudo, citações, R3 da fonte) lê
// docs/. Quem lê docs/versoes/novidades.json é um spec (versoes.paridade) e o separar-pacote,
// e isso cai pela aresta por texto, não por este gatilho.
const ehConteudoFonte = (p: string): boolean =>
  p.startsWith('src/conteudo/') || p.startsWith('src/dados/');

const LEITURA_DE_ARQUIVO = /\b(readFileSync|readdirSync|readFile|statSync|existsSync|globSync)\b/;
const CAMINHO_LITERAL = /(['"`])([^'"`\n\r]{1,400}?)\1/g;

/**
 * Caminhos do repo que o texto de um spec cita, relativos à raiz. Cada literal com '/' ou com
 * extensão (menos .md) é tentado a partir da pasta do spec e da raiz; o que não existe no repo
 * também fica (um arquivo apagado na mudança tem de casar com o spec que o citava).
 */
export function referenciasDoSpec(caminhoSpec: string, conteudo: string): string[] {
  const pasta = posix.dirname(caminhoSpec);
  const achados = new Set<string>();
  for (const m of conteudo.matchAll(CAMINHO_LITERAL)) {
    const lit = m[2] ?? '';
    if (!lit || lit.startsWith('/') || lit.includes('${')) continue;
    if (!lit.includes('/') && !/\.[A-Za-z0-9]{1,8}$/.test(lit)) continue;
    // .md não é insumo de spec (nenhum lê .md do repo). Citar um .md é comentário ou fixture
    // de repo temporário (README.md dentro de um repo de teste), e não dependência.
    if (/\.md$/i.test(lit)) continue;
    for (const base of [pasta, '.']) {
      const c = posix.normalize(posix.join(base, lit)).replace(/\/+$/, '');
      if (c && c !== '.' && !c.startsWith('..')) achados.add(c);
    }
  }
  return [...achados];
}

/** Specs de vitest do repo (as pastas do include de vitest.config.ts), relativos à raiz. */
function listarSpecs(raiz: string): string[] {
  const achados: string[] = [];
  for (const pasta of ['tests/unidade', 'tests/componente', 'tests/caracterizacao']) {
    const abs = join(raiz, pasta);
    if (!existsSync(abs)) continue;
    for (const n of readdirSync(abs, { recursive: true }).map(String)) {
      if (n.endsWith('.spec.ts')) achados.push(`${pasta}/${n.split('\\').join('/')}`);
    }
  }
  return achados.sort();
}

/** Lê os specs do repo e devolve a aresta por texto e a lista de specs que rodam sempre. */
export function coletarReferencias(raiz: string): {
  referencias: Map<string, string[]>;
  sempreRodar: string[];
} {
  const referencias = new Map<string, string[]>();
  const sempreRodar: string[] = [];
  for (const spec of listarSpecs(raiz)) {
    const conteudo = readFileSync(join(raiz, spec), 'utf8');
    const refs = referenciasDoSpec(spec, conteudo);
    referencias.set(spec, refs);
    if (LEITURA_DE_ARQUIVO.test(conteudo) && !refs.some((c) => existsSync(join(raiz, c)))) {
      sempreRodar.push(spec);
    }
  }
  return { referencias, sempreRodar };
}

/** Mudança no repo casa com um caminho citado: arquivo igual, ou pasta citada que o contém. */
const casaComMudanca = (citado: string, arquivos: readonly string[]): boolean =>
  arquivos.some((m) => m === citado || m.startsWith(`${citado}/`));

const ehServidor = (p: string): boolean =>
  p.startsWith('servidor/') || p.startsWith('public/api/') || p === 'public/.htaccess';

const ehSrcOuTests = (p: string): boolean => p.startsWith('src/') || p.startsWith('tests/');

const completo = (motivo: string): Plano => {
  const todos: Decisao = { roda: true, alvo: 'todos', motivo: `completo: ${motivo}` };
  return {
    completo: true,
    motivo,
    passos: {
      lint: todos,
      prettier: todos,
      vueTsc: todos,
      depcruise: todos,
      vitest: todos,
      conteudo: todos,
      php: todos
    }
  };
};

const pulado = (motivo: string): Decisao => ({ roda: false, alvo: null, motivo });

export function planejar(arquivos: readonly string[], opcoes: OpcoesPlano): Plano {
  if (opcoes.completoForcado) return completo('PRECI_COMPLETO=1');
  if (!opcoes.base) return completo('sem tag base (v*) para comparar');
  const gatilho = arquivos.find(ehGatilhoCompleto);
  if (gatilho) return completo(`mudou ${gatilho}, que afeta o preci inteiro`);

  const existe = opcoes.existe ?? (() => true);
  const existentes = arquivos.filter(existe);

  const lint = existentes.filter((p) => EXT_LINT.test(p));
  const prettier = existentes.filter((p) => EXT_PRETTIER.test(p));
  const temSrcOuTests = arquivos.some(ehSrcOuTests);
  const temConteudo = arquivos.some(ehConteudoFonte);
  const temServidor = arquivos.some(ehServidor);

  const vitestArquivos = existentes.filter((p) => ehSrcOuTests(p) && EXT_VITEST.test(p));
  if (arquivos.some((p) => p.startsWith('src/conteudo/')) && opcoes.caracterizacao) {
    vitestArquivos.push(...opcoes.caracterizacao);
  }
  // Aresta por texto: spec que cita (lê por fs) um caminho mudado. O import (grafo) cobre o
  // resto, já que vitest related segue imports diretos e indiretos.
  for (const [spec, citados] of opcoes.referencias ?? []) {
    if (citados.some((c) => casaComMudanca(c, arquivos))) vitestArquivos.push(spec);
  }
  if (temSrcOuTests) vitestArquivos.push(...(opcoes.sempreRodar ?? []));
  const vitestUnicos = [...new Set(vitestArquivos)];

  return {
    completo: false,
    motivo: 'seletivo',
    passos: {
      lint: lint.length
        ? { roda: true, alvo: lint, motivo: '' }
        : pulado('pulado: nenhum arquivo de código mudou'),
      prettier: prettier.length
        ? { roda: true, alvo: prettier, motivo: '' }
        : pulado('pulado: nenhum arquivo formatável mudou'),
      vueTsc: temSrcOuTests
        ? { roda: true, alvo: 'todos', motivo: '' }
        : pulado('pulado: nada em src/ ou tests/ mudou'),
      depcruise: temSrcOuTests
        ? { roda: true, alvo: 'todos', motivo: '' }
        : pulado('pulado: nada em src/ ou tests/ mudou'),
      vitest: vitestUnicos.length
        ? { roda: true, alvo: vitestUnicos, motivo: '' }
        : pulado('pulado: nenhum arquivo de código de teste ou de src mudou'),
      conteudo: temConteudo
        ? { roda: true, alvo: 'todos', motivo: '' }
        : pulado('pulado: nada em src/conteudo, src/dados ou docs/ mudou'),
      php: temServidor
        ? { roda: true, alvo: 'todos', motivo: '' }
        : pulado('pulado: nada em servidor/, public/api/ ou public/.htaccess mudou')
    }
  };
}

// ---- CLI: a saída é atribuição de shell, para o preci.sh fazer eval ----

const cit = (valor: string): string => `'${valor.replace(/'/g, `'\\''`)}'`;

function listarCaracterizacao(raiz: string): string[] {
  const pasta = join(raiz, 'tests/caracterizacao');
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta, { recursive: true })
    .map(String)
    .filter((n) => n.endsWith('.spec.ts'))
    .map((n) => relative(raiz, join(pasta, n)).split('\\').join('/'))
    .sort();
}

function cli(argv: string[]): number {
  const valor = (nome: string): string | undefined => {
    const i = argv.indexOf(nome);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const base = valor('--base') ?? '';
  const arquivoLista = valor('--arquivos');
  const completoForcado = valor('--completo') === '1';
  if (!arquivoLista) {
    console.error('preciSeletivo: falta --arquivos (falha fechada)');
    return 2;
  }
  const raiz = process.cwd();
  const arquivos = readFileSync(arquivoLista, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (arquivos.some((p) => /\s/.test(p))) {
    console.error(
      'preciSeletivo: caminho com espaço ou controle na lista (falha fechada: o preci para)'
    );
    return 2;
  }

  const { referencias, sempreRodar } = coletarReferencias(raiz);
  const plano = planejar(arquivos, {
    base: base || null,
    completoForcado,
    caracterizacao: listarCaracterizacao(raiz),
    existe: (p) => existsSync(join(raiz, p)),
    referencias,
    sempreRodar
  });

  const linhas: string[] = [
    `PRECI_COMPLETO=${plano.completo ? 1 : 0}`,
    `PRECI_MOTIVO=${cit(plano.motivo)}`
  ];
  const nomes: Record<PassoSeletivo, string> = {
    lint: 'LINT',
    prettier: 'PRETTIER',
    vueTsc: 'VUE_TSC',
    depcruise: 'DEPCRUISE',
    vitest: 'VITEST',
    conteudo: 'CONTEUDO',
    php: 'PHP'
  };
  for (const [chave, decisao] of Object.entries(plano.passos) as [PassoSeletivo, Decisao][]) {
    const n = nomes[chave];
    const alvo = decisao.alvo === 'todos' ? 'TODOS' : decisao.alvo ? decisao.alvo.join(' ') : '';
    linhas.push(`PRECI_${n}_RODA=${decisao.roda ? 1 : 0}`);
    linhas.push(`PRECI_${n}_ALVO=${cit(alvo)}`);
    linhas.push(`PRECI_${n}_MOTIVO=${cit(decisao.motivo)}`);
  }
  console.log(linhas.join('\n'));
  return 0;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exit(cli(process.argv.slice(2)));
}
