/**
 * Critério de texto de estudo cifrado (LU-F1.2, E6; LU-F5.2 I-4). Fronteira deste arquivo:
 * dizer o que é fonte cifrada, o que é janela de 40 caracteres, e se um texto em claro
 * contém janela de fonte. Quem chama decide o que fazer com a resposta: o portão da
 * árvore (scripts/verificar-particao.ts) e o portão do histórico da faixa
 * (scripts/apoio/textoEmClaroNaFaixa.ts) usam estas mesmas funções, para que o critério
 * não divirja entre os dois.
 *
 * Não executa nada na importação: só exporta funções e constantes.
 *
 * Fonte: arquivo cifrado que casa ESCOPO_FONTE e não casa FORA_DA_FONTE. Do arquivo entra
 * só o valor das strings (literais e partes de template), pela API do compilador
 * `typescript`. Comentário, import e chave de objeto ficam de fora. Cada valor entra em
 * duas formas: os pedaços entre tags reais, e o valor inteiro sem tags. Entidades são
 * decodificadas antes de normalizar. Cada forma de 40 caracteres ou mais gera janelas
 * deslizantes de 40, sem filtro de palavras.
 *
 * Claro: o texto de um arquivo textual, cru normalizado, e sem tags com entidades
 * decodificadas. Em .ts, .tsx, .js, .jsx e nos blocos `<script>` de .vue, entra também a
 * forma dos literais que se juntam por `+` no AST.
 *
 * Exceção por frase, nunca por arquivo: janela cujo núcleo está contido numa das
 * FRASES_PERMITIDAS não conta. Teto de TETO_FRASES, com falha fechada (quem chama confere).
 *
 * Limites declarados (L-18): janela de texto que só existe fora da fonte (docs/, site/,
 * mockups/, src/dados/, meta.ts, index.ts, dispositivos.ts) não é indexada. Texto de fonte
 * que já saiu da árvore da ponta também não é indexado: o critério lê a árvore destrancada.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import ts from 'typescript';
import { normalizarParaBusca } from '../../src/core/restrito/termosVazamento';

export const TAMANHO_JANELA = 40;
export const FILTRO = 'git-crypt';
export const ESCOPO_FONTE = /^src\/conteudo\/p\d+\/[^/]+\/[^/]+\/.*\.ts$/;
export const FORA_DA_FONTE = /(^|\/)(meta|index|dispositivos)\.ts$/;
/** Tag real: letra logo depois de `<` ou `</`. `a < b` e `x > y` são texto. */
const TAG_REAL = /<\/?[a-z][^<>]*>/gi;
/** Ordem importa: `&amp;` por último, para não decodificar duas vezes. Numéricas vêm antes. */
const ENTIDADES_NOMEADAS: ReadonlyArray<readonly [string, string]> = [
  ['&nbsp;', ' '],
  ['&quot;', '"'],
  ['&apos;', "'"],
  ['&lt;', '<'],
  ['&gt;', '>'],
  ['&amp;', '&']
];
/** Classe FORA da fonte, com motivo. Primeiro que casar vence. */
export const FORA: ReadonlyArray<readonly [RegExp, string]> = [
  [
    /^src\/conteudo\/(.*\/)?(meta|index|dispositivos)\.ts$/,
    'título, índice ou mapa de dispositivos: títulos curtos, fora da fonte (E6)'
  ],
  [
    /^src\/conteudo\/(avisoLegal|curriculo|tipos)\.ts$|^src\/conteudo\/calendario\/|^src\/conteudo\/quiz\/categorias\.ts$|^src\/conteudo\/p\d+\/[^/]+\/cadeira\.ts$/,
    'calendário, aviso legal, currículo, cadeira, tipos e categorias: não é texto de estudo (E6)'
  ],
  [/^src\/dados\//, 'dados de dispositivos em JSON: fora da fonte (E6), limite declarado'],
  [/^docs\//, 'documentação interna: não é texto de estudo e não chega ao leitor (E6, E7)'],
  [/^TODO\.md$/, 'registro interno de pendências (E7)'],
  [
    /^(site|mockups)\//,
    'versão antiga ou mockup do texto; a versão atual está na fonte (E6, limite declarado)'
  ],
  [/^tests\/caracterizacao\//, 'saída de caracterização derivada da fonte (E7)'],
  [/^src\/ui\/area-restrita\/emblema\//, 'binário: imagem do emblema (E7)']
];
export const TETO_FRASES = 5;
export const FRASES_PERMITIDAS = [
  'A justiça é a vontade constante e perpétua de dar a cada um o seu direito.',
  'Procure a legislação aplicável a cada fato.'
];
export const FRASES_NORMALIZADAS = FRASES_PERMITIDAS.map((frase) => normalizarParaBusca(frase));
/** Binários por extensão: os únicos que podem ter NUL e sair do claro sem falha (medido em 07/11/2026). */
export const BINARIAS_POR_EXTENSAO: ReadonlySet<string> = new Set([
  '.woff2',
  '.avif',
  '.jpg',
  '.webp',
  '.png'
]);
/** Tipo de script por extensão, para o parser do compilador (claro, com AST). */
const TIPO_DE_SCRIPT: ReadonlyMap<string, ts.ScriptKind> = new Map([
  ['.ts', ts.ScriptKind.TS],
  ['.mts', ts.ScriptKind.TS],
  ['.cts', ts.ScriptKind.TS],
  ['.tsx', ts.ScriptKind.TSX],
  ['.js', ts.ScriptKind.JS],
  ['.mjs', ts.ScriptKind.JS],
  ['.cjs', ts.ScriptKind.JS],
  ['.jsx', ts.ScriptKind.JSX]
]);
/** Bloco `<script>` de um .vue: o conteúdo entre a abertura e o fechamento. */
const BLOCO_SCRIPT_VUE = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

/** Bytes do arquivo da working tree, ou undefined se ilegível. */
export function lerBytes(raiz: string, caminho: string): Buffer | undefined {
  try {
    return readFileSync(join(raiz, caminho));
  } catch {
    return undefined;
  }
}

/** Texto da FONTE: undefined se houver byte nulo nos 8000 primeiros (árvore trancada) ou se ilegível. */
export function lerTexto(raiz: string, caminho: string): string | undefined {
  const bruto = lerBytes(raiz, caminho);
  if (bruto === undefined || bruto.subarray(0, 8000).includes(0)) return undefined;
  return bruto.toString('utf-8');
}

/** Um processo: `git check-attr` com o `.gitattributes` da árvore. Formato -z: trincas caminho, atributo, valor. */
export function caminhosCifrados(raiz: string, caminhos: string[]): Set<string> {
  const achados = new Set<string>();
  if (caminhos.length === 0) return achados;
  const saida = execFileSync('git', ['check-attr', '-z', '--stdin', 'filter'], {
    cwd: raiz,
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

/** Classe de um caminho cifrado: fonte, fora (com motivo) ou undefined (sem classe, falha). */
export function classificar(
  caminho: string
): { classe: 'fonte' } | { classe: 'fora'; motivo: string } | undefined {
  if (ESCOPO_FONTE.test(caminho) && !FORA_DA_FONTE.test(caminho)) return { classe: 'fonte' };
  for (const [padrao, motivo] of FORA) {
    if (padrao.test(caminho)) return { classe: 'fora', motivo };
  }
  return undefined;
}

/** Trechos de código que o AST percorre: o arquivo inteiro, ou os blocos `<script>` de .vue. */
function trechosCompilados(
  caminho: string,
  codigo: string
): { codigo: string; tipo: ts.ScriptKind }[] {
  const extensao = extname(caminho).toLowerCase();
  if (extensao === '.vue') {
    return [...codigo.matchAll(BLOCO_SCRIPT_VUE)].map((m) => ({
      codigo: m[1] ?? '',
      tipo: ts.ScriptKind.TS
    }));
  }
  const tipo = TIPO_DE_SCRIPT.get(extensao);
  return tipo === undefined ? [] : [{ codigo, tipo }];
}

/** Operandos de uma cadeia `+`, achatada à esquerda e à direita; parênteses saem. */
function operandosDeMais(no: ts.Expression): ts.Expression[] {
  if (ts.isParenthesizedExpression(no)) return operandosDeMais(no.expression);
  if (ts.isBinaryExpression(no) && no.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return [...operandosDeMais(no.left), ...operandosDeMais(no.right)];
  }
  return [no];
}

/** Sequências contíguas de literais da cadeia, unidas. Operando que não é literal (variável, número) quebra a sequência. */
function sequenciasDeLiterais(operandos: ts.Expression[]): string[] {
  const sequencias: string[] = [];
  let atual: string[] = [];
  const fechar = (): void => {
    if (atual.length > 0) sequencias.push(atual.join(''));
    atual = [];
  };
  for (const operando of operandos) {
    if (ts.isStringLiteralLike(operando)) atual.push(operando.text);
    else fechar();
  }
  fechar();
  return sequencias;
}

/** Literais unidos pela raiz de cada cadeia `+` do trecho (a raiz é o `+` cujo pai não é `+`). */
function literaisUnidosDoTrecho(trecho: { codigo: string; tipo: ts.ScriptKind }): string[] {
  const arquivo = ts.createSourceFile(
    'trecho.ts',
    trecho.codigo,
    ts.ScriptTarget.Latest,
    true,
    trecho.tipo
  );
  const unidos: string[] = [];
  const visitar = (no: ts.Node): void => {
    if (ts.isBinaryExpression(no) && no.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const pai = no.parent;
      const ehRaiz =
        pai === undefined ||
        !ts.isBinaryExpression(pai) ||
        pai.operatorToken.kind !== ts.SyntaxKind.PlusToken;
      if (ehRaiz) unidos.push(...sequenciasDeLiterais(operandosDeMais(no)));
    }
    ts.forEachChild(no, visitar);
  };
  visitar(arquivo);
  return unidos;
}

/** Entidades numéricas e nomeadas decodificadas (tabela própria; a de termosVazamento é privada). */
function decodificarEntidades(texto: string): string {
  const numerico = texto
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => codigoParaTexto(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => codigoParaTexto(parseInt(dec, 10)));
  return ENTIDADES_NOMEADAS.reduce((acc, [de, para]) => acc.split(de).join(para), numerico);
}

function codigoParaTexto(codigo: number): string {
  return codigo > 0 && codigo <= 0x10ffff ? String.fromCodePoint(codigo) : '';
}

/** Forma sem tags reais, com entidades decodificadas, normalizada. Vale para fonte e para claro. */
function formaSemTags(texto: string): string {
  return normalizarParaBusca(decodificarEntidades(texto.replace(TAG_REAL, '')));
}

/** Pedaços entre tags reais, e o valor unido sem tags; cada um normalizado; só os de 40 ou mais. */
function fragmentos(valor: string): string[] {
  const pedacos = valor
    .split(TAG_REAL)
    .map((pedaco) => normalizarParaBusca(decodificarEntidades(pedaco)));
  return [...pedacos, formaSemTags(valor)].filter((f) => f.length >= TAMANHO_JANELA);
}

/** As duas formas do texto em claro: cru normalizado, e sem tags com entidades decodificadas. */
export function formasDoClaro(codigo: string): string[] {
  return [normalizarParaBusca(codigo), formaSemTags(codigo)];
}

/** Formas normalizadas dos literais unidos do claro (cru sem tags e com tags tiradas), como a fonte. */
export function formasDeLiteraisUnidos(caminho: string, codigo: string): string[] {
  return trechosCompilados(caminho, codigo)
    .flatMap((trecho) => literaisUnidosDoTrecho(trecho))
    .flatMap((valor) => [normalizarParaBusca(valor), formaSemTags(valor)]);
}

/** Import e nome de chave de objeto não são texto de estudo. */
function ehImportOuChave(no: ts.Node): boolean {
  const pai = no.parent;
  if (!pai) return false;
  if (ts.isImportDeclaration(pai) || ts.isExportDeclaration(pai)) return true;
  return ts.isPropertyAssignment(pai) && pai.name === no;
}

/** Só o valor das strings do arquivo, sem comentário, sem import, sem chave de objeto. */
export function valoresDeString(caminho: string, codigo: string): string[] {
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

/** Janela cujo núcleo, sem espaço nas pontas, está contido numa frase permitida. */
export function ehDeFrasePermitida(janela: string): boolean {
  const nucleo = janela.trim();
  return nucleo.length > 0 && FRASES_NORMALIZADAS.some((frase) => frase.includes(nucleo));
}

/** Índice de janelas da fonte: janela -> primeira fonte que a contém. Lê a árvore em `raiz`. */
export function indexarFontes(
  raiz: string,
  caminhos: string[]
): { janelas: Map<string, string>; fontes: number; trancadas: string[] } {
  const janelas = new Map<string, string>();
  const trancadas: string[] = [];
  let fontes = 0;
  for (const caminho of caminhos) {
    const codigo = lerTexto(raiz, caminho);
    if (codigo === undefined) {
      trancadas.push(caminho);
      continue;
    }
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
  return { janelas, fontes, trancadas };
}

/** Fontes (caminhos de janela) que o texto em claro `codigo` de `caminho` contém. Vazio = nada casou. */
export function fontesCasadas(
  janelas: ReadonlyMap<string, string>,
  caminho: string,
  codigo: string
): Set<string> {
  const origens = new Set<string>();
  const formas = [...formasDoClaro(codigo), ...formasDeLiteraisUnidos(caminho, codigo)];
  for (const forma of formas) {
    for (let i = 0; i + TAMANHO_JANELA <= forma.length; i += 1) {
      const origem = janelas.get(forma.slice(i, i + TAMANHO_JANELA));
      if (origem !== undefined) origens.add(origem);
    }
  }
  return origens;
}
