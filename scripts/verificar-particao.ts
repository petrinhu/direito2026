/**
 * Portão de partição (plano do CTO do login único, 6.1 linha 385, E6 e F1.2b).
 * Reprova qualquer janela de 40 caracteres de TEXTO DE ESTUDO cifrado que
 * apareça em arquivo EM CLARO do repositório. Normalização: caixa, acento e
 * espaço, pela função normalizarParaBusca de src/core/restrito/termosVazamento.ts.
 *
 * Lado cifrado (fonte): arquivo que o .gitattributes real marca como cifrado e
 * que cai na classe FONTE de CLASSES. Do arquivo entra só o valor das strings
 * (literais e partes de template), lido pela API do compilador typescript. Não
 * entram comentário, import, nem nome de chave de objeto. Cada valor entra de
 * duas formas: os pedaços entre tags reais, e o valor inteiro com as tags
 * tiradas (os pedaços unidos). Entidades são decodificadas antes de normalizar.
 * Cada forma de 40 caracteres ou mais gera janelas deslizantes de 40, sem filtro
 * de palavras.
 *
 * Tag real é só `</?[a-z][^<>]*>`: sinal de menor solto (`a < b`) é texto.
 *
 * Lado claro: todo arquivo textual rastreado que não é cifrado, inteiro, com
 * comentário. Cada arquivo é varrido em duas formas: o texto cru normalizado, e
 * o texto com as tags tiradas e as entidades decodificadas, normalizado do mesmo
 * jeito que a fonte.
 *
 * Exceção por frase, nunca por arquivo: uma janela cujo núcleo (sem espaço nas
 * pontas) está contido numa das FRASES_PERMITIDAS não entra no índice. Teto de
 * TETO_FRASES, com falha fechada.
 *
 * Classes (L-17, mesmo desenho de scripts/verificar-travessao-arvore.sh): todo
 * caminho cifrado cai em FONTE ou em FORA da fonte, com motivo escrito. Caminho
 * cifrado sem classe reprova (falha fechada). Cifrado fora da fonte não é
 * varrido como fonte e não reprova; é contado em fora_da_fonte.
 *
 * Limite declarado (L-18): cópia que só existe nas classes FORA (docs/, site/,
 * mockups/, src/dados/) não é pega. meta.ts, index.ts e dispositivos.ts não são
 * fonte (títulos curtos).
 *
 * Saída: encontrados = arquivos em claro com ao menos uma janela casada;
 * analisados = arquivos em claro textuais lidos; falharam = encontrados; fontes =
 * arquivos cifrados lidos como fonte; permitidas = frases permitidas;
 * fora_da_fonte = cifrados em classe FORA; sem_classe = cifrados sem classe (falha).
 * Piso: zero fonte ou zero claro analisado é falha.
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
const FORA: ReadonlyArray<readonly [RegExp, string]> = [
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
function formasDoClaro(codigo: string): string[] {
  return [normalizarParaBusca(codigo), formaSemTags(codigo)];
}

/** Janela cujo núcleo, sem espaço nas pontas, está contido numa frase permitida. */
function ehDeFrasePermitida(janela: string): boolean {
  const nucleo = janela.trim();
  return nucleo.length > 0 && FRASES_NORMALIZADAS.some((frase) => frase.includes(nucleo));
}

/** Classe de um caminho cifrado: fonte, fora (com motivo) ou undefined (sem classe, falha). */
function classificar(
  caminho: string
): { classe: 'fonte' } | { classe: 'fora'; motivo: string } | undefined {
  if (ESCOPO_FONTE.test(caminho) && !FORA_DA_FONTE.test(caminho)) return { classe: 'fonte' };
  for (const [padrao, motivo] of FORA) {
    if (padrao.test(caminho)) return { classe: 'fora', motivo };
  }
  return undefined;
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

  const caminhosFonte: string[] = [];
  const semClasse: string[] = [];
  let foraDaFonte = 0;
  for (const caminho of rastreados.filter((c) => cifrados.has(c))) {
    const classe = classificar(caminho);
    if (classe === undefined) semClasse.push(caminho);
    else if (classe.classe === 'fonte') caminhosFonte.push(caminho);
    else foraDaFonte += 1;
  }
  const { janelas, fontes } = indexarFontes(caminhosFonte);

  let analisados = 0;
  const reprovados: { caminho: string; fontes: Set<string> }[] = [];
  for (const caminho of rastreados) {
    if (cifrados.has(caminho)) continue;
    const codigo = lerTexto(caminho);
    if (codigo === undefined) continue;
    analisados += 1;
    const origens = new Set<string>();
    for (const forma of formasDoClaro(codigo)) {
      for (let i = 0; i + TAMANHO_JANELA <= forma.length; i += 1) {
        const origem = janelas.get(forma.slice(i, i + TAMANHO_JANELA));
        if (origem !== undefined) origens.add(origem);
      }
    }
    if (origens.size > 0) reprovados.push({ caminho, fontes: origens });
  }

  const pisoQuebrado = fontes === 0 || analisados === 0;
  console.log(
    `verificar-particao: encontrados=${reprovados.length} analisados=${analisados} ` +
      `falharam=${reprovados.length} fontes=${fontes} permitidas=${FRASES_PERMITIDAS.length} ` +
      `fora_da_fonte=${foraDaFonte} sem_classe=${semClasse.length}`
  );
  if (pisoQuebrado) {
    console.log(
      '  ZERO fonte ou zero claro analisado: árvore trancada ou escopo quebrado (varredura quebrada)'
    );
  }
  for (const caminho of semClasse) {
    console.log(`  CAMINHO CIFRADO SEM CLASSE (falha fechada): ${caminho}`);
  }
  for (const { caminho, fontes: origens } of reprovados) {
    console.log(`  EM CLARO com trecho de ${origens.size} fonte(s) cifrada(s): ${caminho}`);
  }
  return reprovados.length === 0 && !pisoQuebrado && semClasse.length === 0 ? 0 : 1;
}

try {
  process.exitCode = principal();
} catch (erro) {
  console.error(
    `verificar-particao: git indisponível ou repositório ilegível (falha fechada): ${String(erro)}`
  );
  process.exitCode = 1;
}
