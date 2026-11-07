/**
 * Portão de git-crypt (plano do CTO do login único, 6.2 e F1.2). Primeiro passo do
 * preci: se a cifra falhou, nenhum portão seguinte roda sobre ciphertext (T7).
 *
 * Quatro provas, cada uma contada (L-36):
 *  1. os caminhos cifrados vêm do `.gitattributes` real (`git check-attr filter`),
 *     não de uma lista copiada: o portão segue o que o git de fato cifra;
 *  2. cada blob cifrado do HEAD começa com a magia do git-crypt (cifra de verdade);
 *  3. árvore destravada: nenhum cifrado da working tree começa com a magia (senão
 *     os portões que leem a árvore dariam verde falso);
 *  4. nenhum nome proibido rastreado (plano 6.1, linha 383: juri.json, ids.tsv,
 *     acervo.json e qualquer caminho com a pasta `originais`).
 * Piso: zero caminho cifrado é varredura quebrada (L-36).
 *
 * Saída: `encontrados` = caminhos cifrados no HEAD; `analisados` = blobs lidos;
 * `falharam` = itens reprovados. Três processos no total (ls-tree, check-attr,
 * cat-file --batch), nenhum por arquivo (L-11 item 6).
 *
 * Variável: REPO_RAIZ (padrão: a raiz deste repositório), para provar o vermelho
 * numa cópia descartável.
 */
import { execFileSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(process.env.REPO_RAIZ ?? join(AQUI, '..'));
/** "\0GITCRYPT\0": os 10 primeiros bytes de todo arquivo cifrado pelo git-crypt. */
const MAGIA = Buffer.from([0x00, 0x47, 0x49, 0x54, 0x43, 0x52, 0x59, 0x50, 0x54, 0x00]);
const FILTRO = 'git-crypt';
const NOMES_PROIBIDOS = new Set(['juri.json', 'ids.tsv', 'acervo.json']);
const PASTA_PROIBIDA = 'originais';

function git(args: string[], entrada?: string): Buffer {
  return execFileSync('git', args, { cwd: RAIZ, input: entrada, maxBuffer: 1 << 28 });
}

interface EntradaDoHead {
  readonly caminho: string;
  readonly sha: string;
}

function arvoreDoHead(): EntradaDoHead[] {
  return git(['ls-tree', '-r', '-z', 'HEAD'])
    .toString('utf-8')
    .split('\0')
    .filter((linha) => linha.length > 0)
    .map((linha) => {
      const tab = linha.indexOf('\t');
      const sha = linha.slice(0, tab).split(' ')[2] ?? '';
      return { caminho: linha.slice(tab + 1), sha };
    });
}

/** Um processo só: `git check-attr` lê o `.gitattributes` real. Formato -z: trincas caminho, atributo, valor. */
function caminhosCifrados(caminhos: string[]): Set<string> {
  const achados = new Set<string>();
  if (caminhos.length === 0) return achados;
  const saida = git(['check-attr', '-z', '--stdin', 'filter'], caminhos.join('\0') + '\0')
    .toString('utf-8')
    .split('\0');
  for (let i = 0; i + 2 < saida.length; i += 3) {
    if (saida[i + 2] === FILTRO) achados.add(saida[i] ?? '');
  }
  return achados;
}

/** Um processo só: `git cat-file --batch` devolve, na ordem pedida, cabeçalho e conteúdo. */
function blobsPorSha(shas: string[]): Map<string, Buffer | null> {
  const mapa = new Map<string, Buffer | null>();
  if (shas.length === 0) return mapa;
  const bruto = git(['cat-file', '--batch'], shas.join('\n') + '\n');
  let pos = 0;
  for (const sha of shas) {
    const fim = bruto.indexOf(0x0a, pos);
    if (fim < 0) break;
    const cabecalho = bruto.subarray(pos, fim).toString('utf-8').split(' ');
    if (cabecalho[1] === 'missing' || cabecalho.length !== 3) {
      mapa.set(sha, null);
      pos = fim + 1;
      continue;
    }
    const tamanho = Number(cabecalho[2]);
    mapa.set(sha, bruto.subarray(fim + 1, fim + 1 + tamanho));
    pos = fim + 1 + tamanho + 1;
  }
  return mapa;
}

function comMagia(conteudo: Buffer): boolean {
  return conteudo.length >= MAGIA.length && conteudo.subarray(0, MAGIA.length).equals(MAGIA);
}

/** Lê só os 10 primeiros bytes da working tree; nunca carrega o arquivo inteiro. */
function comMagiaNaArvore(caminho: string): boolean {
  const alvo = join(RAIZ, caminho);
  if (!existsSync(alvo)) return false;
  const descritor = openSync(alvo, 'r');
  try {
    const buffer = Buffer.alloc(MAGIA.length);
    const lidos = readSync(descritor, buffer, 0, MAGIA.length, 0);
    return lidos === MAGIA.length && buffer.equals(MAGIA);
  } finally {
    closeSync(descritor);
  }
}

function ehProibido(caminho: string): boolean {
  const partes = caminho.split('/');
  const nome = partes[partes.length - 1] ?? '';
  return NOMES_PROIBIDOS.has(nome) || partes.includes(PASTA_PROIBIDA);
}

function principal(): number {
  const arvore = arvoreDoHead();
  const cifrados = caminhosCifrados(arvore.map((e) => e.caminho));
  const alvo = arvore.filter((e) => cifrados.has(e.caminho));
  const blobs = blobsPorSha(alvo.map((e) => e.sha));

  const falhas: string[] = [];
  let analisados = 0;
  for (const { caminho, sha } of alvo) {
    analisados += 1;
    const conteudo = blobs.get(sha);
    if (!conteudo || !comMagia(conteudo)) falhas.push(`EM CLARO no HEAD: ${caminho}`);
  }
  // Destravado é o estado esperado: magia na working tree = árvore trancada = reprova.
  for (const caminho of cifrados) {
    if (comMagiaNaArvore(caminho)) falhas.push(`TRANCADO na working tree: ${caminho}`);
  }
  for (const { caminho } of arvore) {
    if (ehProibido(caminho)) falhas.push(`NOME PROIBIDO rastreado: ${caminho}`);
  }
  if (alvo.length === 0) falhas.push('ZERO caminho cifrado: varredura quebrada (falha fechada)');

  console.log(
    `verificar-git-crypt: encontrados=${alvo.length} analisados=${analisados} falharam=${falhas.length}`
  );
  for (const falha of falhas) console.log(`  ${falha}`);
  return falhas.length === 0 ? 0 : 1;
}

try {
  process.exitCode = principal();
} catch (erro) {
  console.error(
    `verificar-git-crypt: git indisponível ou repositório ilegível (falha fechada): ${String(erro)}`
  );
  process.exitCode = 1;
}
