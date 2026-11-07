/**
 * Portão de partição (plano do CTO do login único, 6.1 linha 385, E6 e F1.2b).
 * Reprova qualquer janela de 40 caracteres de TEXTO DE ESTUDO cifrado que
 * apareça em arquivo EM CLARO do repositório. Normalização: caixa, acento e
 * espaço, pela função normalizarParaBusca de src/core/restrito/termosVazamento.ts.
 *
 * Lado cifrado (fonte): arquivo que o .gitattributes real marca como cifrado,
 * casa ESCOPO_FONTE e não casa FORA_DA_FONTE. Do arquivo entra só o valor das
 * strings (literais e partes de template), lido pela API do compilador
 * typescript. Não entram comentário, import, nem nome de chave de objeto. Cada
 * valor é cortado em tag e entidade, normalizado, e cada pedaço de 40 caracteres
 * ou mais gera janelas deslizantes de 40, sem filtro de palavras.
 *
 * Exceção por frase, nunca por arquivo: uma janela cujo núcleo (sem espaço nas
 * pontas) está contido numa das FRASES_PERMITIDAS não entra no índice. Teto de
 * TETO_FRASES, com falha fechada.
 *
 * Lado claro: todo arquivo textual rastreado que não é cifrado, inteiro, com
 * comentário.
 *
 * Limite declarado (L-18): cópia que só existe em docs/, site/ ou mockups/ não é
 * pega. meta.ts, index.ts e dispositivos.ts não são fonte (títulos curtos).
 *
 * Saída: encontrados = arquivos em claro com ao menos uma janela casada;
 * analisados = arquivos em claro textuais lidos; falharam = encontrados; fontes =
 * arquivos cifrados lidos como fonte; permitidas = frases permitidas. Piso: zero
 * fonte ou zero claro analisado é falha.
 *
 * Variável: REPO_RAIZ (padrão: a raiz deste repositório).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { normalizarParaBusca } from '../src/core/restrito/termosVazamento';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(process.env.REPO_RAIZ ?? join(AQUI, '..'));
const TAMANHO_JANELA = 40;
const FILTRO = 'git-crypt';
const ESCOPO_FONTE = /^src\/conteudo\/p\d+\/[^/]+\/[^/]+\/.*\.ts$/;
const FORA_DA_FONTE = /(^|\/)(meta|index|dispositivos)\.ts$/;
const CORTE_TAG_ENTIDADE = /<[^>]*>|&[a-z#0-9]+;/i;
const TETO_FRASES = 5;
const FRASES_PERMITIDAS = [
  'A justiça é a vontade constante e perpétua de dar a cada um o seu direito.',
  'Procure a legislação aplicável a cada fato.'
];
const FRASES_NORMALIZADAS = FRASES_PERMITIDAS.map((frase) => normalizarParaBusca(frase));

function git(args: string[]): Buffer {
  return execFileSync('git', args, { cwd: RAIZ, maxBuffer: 1 << 28 });
}

/** Um processo: `git check-attr` com o `.gitattributes` real. Formato -z: trincas caminho, atributo, valor. */
function caminhosCifrados(caminhos: string[]): Set<string> {
  const achados = new Set<string>();
  if (caminhos.length === 0) return achados;
  const saida = execFileSync('git', ['check-attr', '-z', '--stdin', 'filter'], {
    cwd: RAIZ,
    input: caminhos.join('\0') + '\0',
    maxBuffer: 1 << 28
  })
    .toString('utf-8')
    .split('\0');
  for (let i = 0; i + 2 < saida.length; i += 3) {
    if (saida[i + 2] === FILTRO) achados.add(saida[i] ?? '');
  }
  return achados;
}

/** Texto bruto do arquivo da working tree, ou undefined se for binário (byte nulo nos 8000 primeiros) ou ilegível. */
function lerTexto(caminho: string): string | undefined {
  try {
    const bruto = readFileSync(join(RAIZ, caminho));
    if (bruto.subarray(0, 8000).includes(0)) return undefined;
    return bruto.toString('utf-8');
  } catch {
    return undefined;
  }
}

/** Import e nome de chave de objeto não são texto de estudo. */
function ehImportOuChave(no: ts.Node): boolean {
  const pai = no.parent;
  if (!pai) return false;
  if (ts.isImportDeclaration(pai) || ts.isExportDeclaration(pai)) return true;
  return ts.isPropertyAssignment(pai) && pai.name === no;
}

/** Só o valor das strings do arquivo, sem comentário, sem import, sem chave de objeto. */
function valoresDeString(caminho: string, codigo: string): string[] {
  const arquivo = ts.createSourceFile(
    caminho,
    codigo,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const valores: string[] = [];
  const visitar = (no: ts.Node): void => {
    if (ehImportOuChave(no)) return;
    if (
      ts.isStringLiteralLike(no) ||
      ts.isTemplateHead(no) ||
      ts.isTemplateMiddle(no) ||
      ts.isTemplateTail(no)
    ) {
      valores.push(no.text);
      return;
    }
    ts.forEachChild(no, visitar);
  };
  visitar(arquivo);
  return valores;
}

/** Corta o valor em tag e entidade, normaliza cada pedaço e mantém só os de 40 caracteres ou mais. */
function fragmentos(valor: string): string[] {
  return valor
    .split(CORTE_TAG_ENTIDADE)
    .map((pedaco) => normalizarParaBusca(pedaco))
    .filter((pedaco) => pedaco.length >= TAMANHO_JANELA);
}

/** Janela cujo núcleo, sem espaço nas pontas, está contido numa frase permitida. */
function ehDeFrasePermitida(janela: string): boolean {
  const nucleo = janela.trim();
  return nucleo.length > 0 && FRASES_NORMALIZADAS.some((frase) => frase.includes(nucleo));
}

/** Índice de janelas do cifrado: janela -> primeira fonte que a contém. */
function indexarFontes(caminhos: string[]): { janelas: Map<string, string>; fontes: number } {
  const janelas = new Map<string, string>();
  let fontes = 0;
  for (const caminho of caminhos) {
    const codigo = lerTexto(caminho);
    if (codigo === undefined) continue;
    fontes += 1;
    for (const valor of valoresDeString(caminho, codigo)) {
      for (const fragmento of fragmentos(valor)) {
        for (let i = 0; i + TAMANHO_JANELA <= fragmento.length; i += 1) {
          const janela = fragmento.slice(i, i + TAMANHO_JANELA);
          if (ehDeFrasePermitida(janela) || janelas.has(janela)) continue;
          janelas.set(janela, caminho);
        }
      }
    }
  }
  return { janelas, fontes };
}

function principal(): number {
  if (FRASES_PERMITIDAS.length > TETO_FRASES) {
    console.log(
      `verificar-particao: ${FRASES_PERMITIDAS.length} frases permitidas, teto ${TETO_FRASES} (falha fechada)`
    );
    return 1;
  }

  const rastreados = git(['ls-files', '-z'])
    .toString('utf-8')
    .split('\0')
    .filter((c) => c.length > 0);
  const cifrados = caminhosCifrados(rastreados);
  const caminhosFonte = rastreados.filter(
    (c) => cifrados.has(c) && ESCOPO_FONTE.test(c) && !FORA_DA_FONTE.test(c)
  );
  const { janelas, fontes } = indexarFontes(caminhosFonte);

  let analisados = 0;
  const reprovados: { caminho: string; fontes: Set<string> }[] = [];
  for (const caminho of rastreados) {
    if (cifrados.has(caminho)) continue;
    const codigo = lerTexto(caminho);
    if (codigo === undefined) continue;
    analisados += 1;
    const texto = normalizarParaBusca(codigo);
    const origens = new Set<string>();
    for (let i = 0; i + TAMANHO_JANELA <= texto.length; i += 1) {
      const origem = janelas.get(texto.slice(i, i + TAMANHO_JANELA));
      if (origem !== undefined) origens.add(origem);
    }
    if (origens.size > 0) reprovados.push({ caminho, fontes: origens });
  }

  const pisoQuebrado = fontes === 0 || analisados === 0;
  console.log(
    `verificar-particao: encontrados=${reprovados.length} analisados=${analisados} ` +
      `falharam=${reprovados.length} fontes=${fontes} permitidas=${FRASES_PERMITIDAS.length}`
  );
  if (pisoQuebrado) {
    console.log(
      '  ZERO fonte ou zero claro analisado: árvore trancada ou escopo quebrado (varredura quebrada)'
    );
  }
  for (const { caminho, fontes: origens } of reprovados) {
    console.log(`  EM CLARO com trecho de ${origens.size} fonte(s) cifrada(s): ${caminho}`);
  }
  return reprovados.length === 0 && !pisoQuebrado ? 0 : 1;
}

try {
  process.exitCode = principal();
} catch (erro) {
  console.error(
    `verificar-particao: git indisponível ou repositório ilegível (falha fechada): ${String(erro)}`
  );
  process.exitCode = 1;
}
