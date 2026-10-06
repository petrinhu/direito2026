/**
 * Portão de vazamento do conteúdo restrito (L-28, L-36). Lê o JSON privado,
 * extrai integrantes, instituição e trechos distintivos (>= 40 caracteres,
 * sem tags) do resumo e do quiz, e procura cada um, sem diferenciar
 * maiúsculas nem acentos, em: todos os arquivos de dist/, todos os arquivos
 * rastreados pelo git e o histórico inteiro (`git log --all -p`).
 *
 * Imprime SÓ contagens (analisados/encontrados), nunca um termo. O nome do
 * grupo é público e fica fora da busca. Falha fechada: JSON ausente, zero
 * termo, zero arquivo analisado ou git indisponível saem 1, e qualquer
 * termo encontrado sai 1.
 *
 * Variáveis (todas opcionais, para provar o portão vermelho fora da árvore):
 *   CADERNO_RESTRITO  caminho do JSON (padrão relativo à raiz do repositório:
 *                     ../site_direito2026_restrito/conteudo/interdisciplinar.json)
 *   DIST_PATH         pasta do pacote (padrão dist/ da raiz)
 *   REPO_RAIZ         raiz do repositório git a varrer (padrão: a deste script)
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  indicesEncontrados,
  extrairTermosDeVazamento,
  normalizarParaBusca
} from '../src/core/restrito/termosVazamento';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(process.env.REPO_RAIZ ?? join(AQUI, '..'));
const DIST = resolve(RAIZ, process.env.DIST_PATH ?? 'dist');
const CAMINHO_JSON = resolve(
  RAIZ,
  process.env.CADERNO_RESTRITO ?? '../site_direito2026_restrito/conteudo/interdisciplinar.json'
);

interface Varredura {
  readonly analisados: number;
  readonly encontrados: ReadonlySet<number>;
}

function arquivosDe(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    return entrada.isDirectory() ? arquivosDe(caminho) : [caminho];
  });
}

function procurar(alvoNormalizado: string, termos: readonly string[], achados: Set<number>): void {
  for (const i of indicesEncontrados(alvoNormalizado, termos)) achados.add(i);
}

function varrerArquivos(caminhos: readonly string[], termos: readonly string[]): Varredura {
  const achados = new Set<number>();
  let analisados = 0;
  for (const caminho of caminhos) {
    if (!existsSync(caminho) || !statSync(caminho).isFile()) continue;
    procurar(normalizarParaBusca(readFileSync(caminho).toString('utf-8')), termos, achados);
    analisados += 1;
  }
  return { analisados, encontrados: achados };
}

function varrerHistorico(termos: readonly string[]): Promise<Varredura> {
  return new Promise((resolver, rejeitar) => {
    const achados = new Set<number>();
    const maior = Math.max(...termos.map((t) => t.length));
    // Só os diffs (formato vazio): o cabeçalho de autor repetiria nome real em todo commit.
    const git = spawn('git', ['log', '--all', '-p', '--format='], { cwd: RAIZ });
    git.stdout.setEncoding('utf-8');
    let cauda = '';
    let bytes = 0;
    git.stdout.on('data', (pedaco: string) => {
      bytes += Buffer.byteLength(pedaco);
      // Tira o marcador de diff (+, - ou espaço) do começo de cada linha para
      // um trecho quebrado em várias linhas ainda casar.
      const alvo = normalizarParaBusca(cauda + pedaco.replace(/\n[+ -]/g, '\n'));
      procurar(alvo, termos, achados);
      cauda = alvo.slice(-maior);
    });
    git.on('error', rejeitar);
    git.on('close', (codigo) => {
      if (codigo !== 0) rejeitar(new Error(`git log saiu com ${codigo}`));
      else resolver({ analisados: bytes, encontrados: achados });
    });
  });
}

async function principal(): Promise<number> {
  if (!existsSync(CAMINHO_JSON)) {
    console.error('verificar-conteudo-restrito: JSON privado ausente (falha fechada)');
    return 1;
  }
  let bruto: unknown;
  try {
    bruto = JSON.parse(readFileSync(CAMINHO_JSON, 'utf-8'));
  } catch {
    console.error('verificar-conteudo-restrito: JSON privado malformado (falha fechada)');
    return 1;
  }

  const { integrantes, instituicao, trechos } = extrairTermosDeVazamento(bruto);
  const termos = [...integrantes, ...instituicao, ...trechos];
  console.log(
    `termos: integrantes=${integrantes.length} instituicao=${instituicao.length} trechos=${trechos.length}`
  );
  if (integrantes.length === 0 || instituicao.length === 0 || trechos.length === 0) {
    console.error('verificar-conteudo-restrito: termo ausente no JSON é varredura quebrada');
    return 1;
  }

  let rastreados: string[];
  try {
    rastreados = execFileSync('git', ['ls-files', '-z'], { cwd: RAIZ, maxBuffer: 1 << 28 })
      .toString('utf-8')
      .split('\0')
      .filter((c) => c.length > 0)
      .map((c) => join(RAIZ, c));
  } catch {
    console.error('verificar-conteudo-restrito: git ls-files falhou (falha fechada)');
    return 1;
  }

  const dist = existsSync(DIST) ? varrerArquivos(arquivosDe(DIST), termos) : undefined;
  const arvore = varrerArquivos(rastreados, termos);
  let historico: Varredura;
  try {
    historico = await varrerHistorico(termos);
  } catch {
    console.error('verificar-conteudo-restrito: histórico do git ilegível (falha fechada)');
    return 1;
  }

  let falhou = false;
  const relatar = (nome: string, unidade: string, v: Varredura | undefined): void => {
    if (!v || v.analisados === 0) {
      console.error(`${nome}: zero ${unidade} analisado é varredura quebrada`);
      falhou = true;
      return;
    }
    const por = (lista: readonly string[], deslocamento: number): number =>
      [...v.encontrados].filter((i) => i >= deslocamento && i < deslocamento + lista.length).length;
    console.log(
      `${nome}: analisados=${v.analisados} (${unidade}) encontrados=${v.encontrados.size} ` +
        `(integrantes=${por(integrantes, 0)} instituicao=${por(instituicao, integrantes.length)} trechos=${por(trechos, integrantes.length + instituicao.length)})`
    );
    if (v.encontrados.size > 0) falhou = true;
  };
  relatar('dist', 'arquivos', dist);
  relatar('rastreados', 'arquivos', arvore);
  relatar('historico', 'bytes', historico);

  if (falhou) console.error('verificar-conteudo-restrito: VAZAMENTO ou varredura quebrada');
  else console.log('verificar-conteudo-restrito: nada encontrado fora da área restrita');
  return falhou ? 1 : 0;
}

principal().then((codigo) => {
  process.exitCode = codigo;
});
