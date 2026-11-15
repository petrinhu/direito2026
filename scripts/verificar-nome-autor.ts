/**
 * Trava do nome do titular (SB-F7). O nome completo só pode existir na fonte única cifrada,
 * src/conteudo/sobre/autoria.ts. Três modos, todos numa só execução (L-11, item 6):
 *
 *   --arvore <raiz>      todo arquivo de `git ls-files` da raiz; só a fonte permitida pode
 *                        conter o nome. Lista de permissão de UM caminho, mora aqui.
 *   --pacote <dir>       o pacote separado: zero ocorrência em webroot/ e em index.html; em
 *                        app/, só em arquivos .js (a exceção estreita); nada mais no pacote.
 *   --entrada <arquivo>  a resposta anônima do servidor: zero ocorrência.
 *
 * Antes de comparar, o texto é desfeito como um navegador ou um interpretador desfaria: tags
 * HTML saem, entidades (nomeadas, decimais e hexadecimais) e escapes JS e percent-encoding são
 * decodificados, caracteres invisíveis (largura zero, hífen suave) saem, e a comparação é feita
 * sem nenhum espaço. Byte NUL em arquivo que não é binário conhecido é FALHA, nunca pulo (como
 * scripts/verificar-particao.ts). A saída é sempre a linha de resumo com
 * encontrados/analisados/falharam, e tudo vai para o stdout. Sem arquivo analisado, reprova.
 * Nunca imprime o nome, só o caminho do arquivo (L-28).
 *
 * Variável: VERIFICAR_TITULAR_ARQUIVO (padrão: src/conteudo/sobre/autoria.ts desta raiz). Uma fonte
 * ausente ou cifrada reprova: esta trava só roda com a chave destravada (preci e conferência do ar).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const FONTE_PERMITIDA = 'src/conteudo/sobre/autoria.ts';
const CABECALHO_CIFRA = Buffer.from('\0GITCRYPT\0');
const BINARIAS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.pdf',
  '.zip',
  '.gz',
  '.br',
  '.wasm',
  '.mp3',
  '.ogg',
  '.mp4',
  '.webm'
]);
/** Caracteres que somem na tela: largura zero, hífen suave, marcas de direção. */
const INVISIVEIS = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/gu;

interface Contagem {
  encontrados: number;
  analisados: number;
  falharam: number;
}

class FalhaFatal extends Error {}

type Modo =
  | { readonly tipo: 'arvore'; readonly caminho: string }
  | { readonly tipo: 'pacote'; readonly caminho: string }
  | { readonly tipo: 'entrada'; readonly caminho: string };

type Veredito = 'limpo' | 'nome' | 'nul';

/** Decodifica um código de caractere com segurança: código inválido fica como estava. */
function caractere(codigo: number, original: string): string {
  return Number.isFinite(codigo) && codigo >= 0 && codigo <= 0x10ffff
    ? String.fromCodePoint(codigo)
    : original;
}

/** Entidades HTML: nomeadas básicas, letra com acento (&ccedil;, &Aacute;...), numéricas. */
function decodificarEntidades(texto: string): string {
  let atual = texto;
  // Até três passes: entidade escrita dentro de entidade (&amp;nbsp;) também cai.
  for (let passo = 0; passo < 3; passo++) {
    const antes = atual;
    atual = atual
      .replace(/&#x([0-9a-f]+);?/gi, (m, hex: string) => caractere(parseInt(hex, 16), m))
      .replace(/&#(\d+);?/g, (m, dec: string) => caractere(parseInt(dec, 10), m))
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&([a-zA-Z])(acute|grave|circ|tilde|uml|cedil|ring|slash);/g, '$1');
    if (atual === antes) break;
  }
  return atual;
}

/** Escapes JS: \uXXXX, \u{X...} e \xXX, como um literal de string os desfaria. */
function decodificarEscapesJs(texto: string): string {
  return texto
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (m, hex: string) => caractere(parseInt(hex, 16), m))
    .replace(/\\u([0-9a-fA-F]{4})/g, (m, hex: string) => caractere(parseInt(hex, 16), m))
    .replace(/\\x([0-9a-fA-F]{2})/g, (m, hex: string) => caractere(parseInt(hex, 16), m));
}

/** Percent-encoding: sequências %XX em UTF-8 (sequência inválida fica como estava). */
function decodificarPercent(texto: string): string {
  return texto.replace(/(%[0-9a-fA-F]{2})+/g, (m) => {
    try {
      return decodeURIComponent(m);
    } catch {
      return m;
    }
  });
}

/**
 * Forma comparável: tags fora, entidades e escapes desfeitos, invisíveis fora, sem acento,
 * minúscula e sem espaço nenhum. O nome e o texto passam por ela.
 */
export function normalizar(texto: string): string {
  const semTags = texto.replace(/<[^>]*>/g, '');
  const desfeito = decodificarPercent(decodificarEscapesJs(decodificarEntidades(semTags)));
  return desfeito
    .replace(INVISIVEIS, '')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/\s+/gu, '');
}

/** Lê o titular da fonte. Ausente, cifrada ou sem a constante é falha fechada. */
export function lerTitular(caminho: string): string {
  if (!existsSync(caminho)) throw new FalhaFatal(`fonte do titular ausente: ${caminho}`);
  const bruto = readFileSync(caminho);
  if (bruto.subarray(0, CABECALHO_CIFRA.length).equals(CABECALHO_CIFRA)) {
    throw new FalhaFatal('fonte do titular cifrada: destrave a chave antes da trava');
  }
  const achado = /export const TITULAR = '([^']+)'/.exec(bruto.toString('utf-8'));
  if (!achado) throw new FalhaFatal('constante TITULAR não achada na fonte');
  const alvo = normalizar(achado[1] ?? '');
  if (alvo === '') throw new FalhaFatal('titular vazio na fonte');
  return alvo;
}

/** O nome, em qualquer forma que `normalizar` desfaz, ou NUL em texto que não é binário. */
function analisar(buffer: Buffer, rel: string, alvo: string): Veredito {
  if (normalizar(buffer.toString('utf-8')).includes(alvo)) return 'nome';
  if (buffer.includes(0) && !BINARIAS.has(extname(rel).toLowerCase())) return 'nul';
  return 'limpo';
}

function falha(acc: Contagem, onde: string, motivo = 'nome do titular em'): void {
  acc.falharam++;
  console.log(`${motivo}: ${onde}`);
}

function varrerArvore(raiz: string, alvo: string, acc: Contagem): void {
  const rastreados = execFileSync('git', ['-C', raiz, 'ls-files', '-z'], { encoding: 'utf-8' })
    .split('\0')
    .filter((rel) => rel !== '');
  for (const rel of rastreados) {
    acc.encontrados++;
    const caminho = join(raiz, rel);
    if (!existsSync(caminho)) {
      falha(acc, `${rel} (ilegível)`);
      continue;
    }
    acc.analisados++;
    if (rel === FONTE_PERMITIDA) continue;
    const veredito = analisar(readFileSync(caminho), rel, alvo);
    if (veredito === 'nome') falha(acc, rel);
    else if (veredito === 'nul') falha(acc, rel, 'byte NUL em arquivo de texto (falha, não pulo)');
  }
}

function listarArquivos(dir: string): string[] {
  const achados: string[] = [];
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) achados.push(...listarArquivos(caminho));
    else achados.push(caminho);
  }
  return achados;
}

function varrerPacote(dir: string, alvo: string, acc: Contagem): void {
  if (!existsSync(dir)) throw new FalhaFatal(`pacote ausente: ${dir}`);
  for (const caminho of listarArquivos(dir)) {
    const rel = relative(dir, caminho).split(sep).join('/');
    acc.encontrados++;
    acc.analisados++;
    const veredito = analisar(readFileSync(caminho), rel, alvo);
    if (veredito === 'limpo') continue;
    if (veredito === 'nul') {
      falha(acc, rel, 'byte NUL em arquivo de texto (falha, não pulo)');
      continue;
    }
    // Exceção estreita: o bundle do app (app/*.js). Webroot, index.html e o resto do pacote não.
    const permitido = rel.startsWith('app/') && rel.endsWith('.js') && rel !== 'app/index.html';
    if (!permitido) falha(acc, rel);
  }
}

function varrerEntrada(arquivo: string, alvo: string, acc: Contagem): void {
  if (!existsSync(arquivo)) throw new FalhaFatal(`resposta anônima ausente: ${arquivo}`);
  acc.encontrados++;
  acc.analisados++;
  const veredito = analisar(readFileSync(arquivo), arquivo, alvo);
  if (veredito === 'nome') falha(acc, `resposta anônima (${arquivo})`);
  else if (veredito === 'nul') {
    falha(acc, `resposta anônima (${arquivo})`, 'byte NUL em arquivo de texto (falha, não pulo)');
  }
}

function lerModos(argv: readonly string[]): Modo[] {
  const modos: Modo[] = [];
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const valor = argv[i + 1];
    if (valor === undefined) throw new FalhaFatal(`argumento sem valor: ${flag ?? ''}`);
    if (flag === '--arvore') modos.push({ tipo: 'arvore', caminho: resolve(valor) });
    else if (flag === '--pacote') modos.push({ tipo: 'pacote', caminho: resolve(valor) });
    else if (flag === '--entrada') modos.push({ tipo: 'entrada', caminho: resolve(valor) });
    else throw new FalhaFatal(`argumento desconhecido: ${flag ?? ''}`);
  }
  return modos;
}

function executar(argv: readonly string[]): number {
  const acc: Contagem = { encontrados: 0, analisados: 0, falharam: 0 };
  try {
    const modos = argv.length === 0 ? [{ tipo: 'arvore', caminho: RAIZ } as Modo] : lerModos(argv);
    const alvo = lerTitular(process.env.VERIFICAR_TITULAR_ARQUIVO ?? join(RAIZ, FONTE_PERMITIDA));
    for (const modo of modos) {
      try {
        if (modo.tipo === 'arvore') varrerArvore(modo.caminho, alvo, acc);
        else if (modo.tipo === 'pacote') varrerPacote(modo.caminho, alvo, acc);
        else varrerEntrada(modo.caminho, alvo, acc);
      } catch (erro) {
        acc.falharam++;
        console.log(erro instanceof FalhaFatal ? erro.message : `não lido: modo ${modo.tipo}`);
      }
    }
  } catch (erro) {
    acc.falharam++;
    console.log(erro instanceof FalhaFatal ? erro.message : 'não lido: argumentos ou fonte');
  }
  console.log(
    `verificar-nome-autor: encontrados=${acc.encontrados} analisados=${acc.analisados} falharam=${acc.falharam}`
  );
  if (acc.falharam > 0) return 1;
  if (acc.analisados === 0) {
    console.log('verificar-nome-autor: zero arquivo analisado, varredura quebrada');
    return 1;
  }
  return 0;
}

process.exitCode = executar(process.argv.slice(2));
