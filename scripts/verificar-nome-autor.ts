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
 * A comparação é normalizada como o portão de termos (sem acento, minúscula, espaço colapsado),
 * então caixa, acento e espaço duplo não escapam. A saída é sempre a linha de resumo com
 * encontrados/analisados/falharam; sem nenhum arquivo analisado, reprova (piso de varredura).
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
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.pdf',
  '.zip'
]);

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

/** Sem acento, minúscula e espaço colapsado: a mesma forma para o nome e para o texto. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
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

/** Texto com NUL é binário ou cifrado: não é texto, então não contém o nome em claro. */
function contem(buffer: Buffer, alvo: string): boolean {
  if (buffer.includes(0)) return false;
  return normalizar(buffer.toString('utf-8')).includes(alvo);
}

function falha(acc: Contagem, onde: string): void {
  acc.falharam++;
  console.log(`nome do titular em: ${onde}`);
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
    if (rel === FONTE_PERMITIDA || BINARIAS.has(extname(rel).toLowerCase())) continue;
    if (contem(readFileSync(caminho), alvo)) falha(acc, rel);
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
    if (!contem(readFileSync(caminho), alvo)) continue;
    // Exceção estreita: o bundle do app (app/*.js). Webroot, index.html e o resto do pacote não.
    const permitido = rel.startsWith('app/') && rel.endsWith('.js') && rel !== 'app/index.html';
    if (!permitido) falha(acc, rel);
  }
}

function varrerEntrada(arquivo: string, alvo: string, acc: Contagem): void {
  if (!existsSync(arquivo)) throw new FalhaFatal(`resposta anônima ausente: ${arquivo}`);
  acc.encontrados++;
  acc.analisados++;
  if (contem(readFileSync(arquivo), alvo)) falha(acc, `resposta anônima (${arquivo})`);
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
        console.error(erro instanceof FalhaFatal ? erro.message : `não lido: modo ${modo.tipo}`);
      }
    }
  } catch (erro) {
    acc.falharam++;
    console.error(erro instanceof FalhaFatal ? erro.message : 'não lido: argumentos ou fonte');
  }
  console.log(
    `verificar-nome-autor: encontrados=${acc.encontrados} analisados=${acc.analisados} falharam=${acc.falharam}`
  );
  if (acc.falharam > 0) return 1;
  if (acc.analisados === 0) {
    console.error('verificar-nome-autor: zero arquivo analisado, varredura quebrada');
    return 1;
  }
  return 0;
}

process.exitCode = executar(process.argv.slice(2));
