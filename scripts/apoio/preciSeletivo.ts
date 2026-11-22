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
import { join, relative } from 'node:path';

export type PassoSeletivo = 'lint' | 'prettier' | 'vueTsc' | 'depcruise' | 'vitest' | 'conteudo' | 'php';

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
}

const EXT_LINT = /\.(ts|tsx|vue|js|mjs|cjs)$/;
const EXT_PRETTIER = /\.(ts|tsx|vue|js|mjs|cjs|json|md|css|html|ya?ml)$/;
const EXT_VITEST = /\.(ts|tsx|vue|js|mjs)$/;

const ehGatilhoCompleto = (p: string): boolean =>
  p.startsWith('scripts/') ||
  p === 'package.json' ||
  p === 'package-lock.json' ||
  /^(vite|vitest|playwright)(\.[\w-]+)?\.config\.[cm]?[jt]s$/.test(p) ||
  /^tsconfig[\w.-]*\.json$/.test(p) ||
  p.startsWith('.dependency-cruiser') ||
  p.startsWith('tests/apoio/');

const ehConteudoFonte = (p: string): boolean =>
  p.startsWith('src/conteudo/') || p.startsWith('src/dados/') || p.startsWith('docs/');

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
    console.error('preciSeletivo: caminho com espaço ou controle na lista (falha fechada: o preci para)');
    return 2;
  }

  const plano = planejar(arquivos, {
    base: base || null,
    completoForcado,
    caracterizacao: listarCaracterizacao(raiz),
    existe: (p) => existsSync(join(raiz, p))
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
