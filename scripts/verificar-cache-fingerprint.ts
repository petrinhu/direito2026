/**
 * Portão de cache, invertido em 07/11/2026 (plano do CTO, 7.3; LU-F4.5).
 *
 * Antes, o portão aceitava `immutable` com nome de arquivo com hash, por um ano.
 * Agora o pacote não tem cache de longa duração nem compartilhável: nenhum
 * cabeçalho pode ter `immutable` nem `public`. A regra é a mesma do gêmeo em
 * servidor/testes/estatico.teste.php (linhas 73 e 95): filtra primeiro as linhas
 * do cabeçalho de cache, e só então procura o termo. Sem o filtro, `public function`
 * em PHP viraria falso positivo.
 *
 * Três pontos, cada um reprova sozinho:
 *  1. linhas `Header` de public/.htaccess;
 *  2. linhas com cache-control dos PHP da API (public/api/**, servidor/dev/*.php);
 *  3. o Cache-Control efetivo de cada arquivo de dist (blocos FilesMatch em ordem,
 *     o último que casa vale, como o mod_headers).
 *
 * Piso (L-36): zero linha Header, zero PHP de API ou zero arquivo em dist é falha.
 *
 * Variáveis (opcionais): VERIFICAR_CACHE_FINGERPRINT_RAIZ (raiz do repositório, para
 * provar vermelho numa cópia), VERIFICAR_CACHE_FINGERPRINT_DIST (padrão RAIZ/dist).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(process.env.VERIFICAR_CACHE_FINGERPRINT_RAIZ ?? resolve(AQUI, '..'));
const DIST = resolve(process.env.VERIFICAR_CACHE_FINGERPRINT_DIST ?? join(RAIZ, 'dist'));
const HTACCESS = join(RAIZ, 'public/.htaccess');

/** Gêmeo: servidor/testes/estatico.teste.php:73. Mesma palavra-chave, mesmo critério. */
const PROIBIDO = /immutable|\bpublic\b/i;

interface BlocoFilesMatch {
  readonly padrao: RegExp;
  readonly cacheControl: string;
}

function listarArquivos(pasta: string, base: string = pasta): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) return listarArquivos(caminho, base);
    return [relative(base, caminho).split(sep).join('/')];
  });
}

/** Blocos FilesMatch com Header set Cache-Control, na ordem em que aparecem. */
function lerBlocos(texto: string): BlocoFilesMatch[] {
  const blocos: BlocoFilesMatch[] = [];
  const regexBloco = /<FilesMatch\s+"([^"]+)">([\s\S]*?)<\/FilesMatch>/g;
  let m: RegExpExecArray | null;
  while ((m = regexBloco.exec(texto))) {
    const padraoTexto = m[1];
    const corpo = m[2] ?? '';
    const cacheControl = corpo.match(/Header set Cache-Control\s+"([^"]+)"/)?.[1];
    if (!padraoTexto || !cacheControl) continue;
    blocos.push({ padrao: new RegExp(padraoTexto), cacheControl });
  }
  return blocos;
}

/** O último bloco que casa com o nome decide o Cache-Control final (mod_headers). */
function cacheEfetivo(nome: string, blocos: readonly BlocoFilesMatch[]): string | undefined {
  let resultado: string | undefined;
  for (const bloco of blocos) {
    if (bloco.padrao.test(nome)) resultado = bloco.cacheControl;
  }
  return resultado;
}

function principal(): number {
  if (!statSync(DIST, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(
      `verificar-cache-fingerprint: pasta ausente: ${DIST} (rode 'npm run build' antes)`
    );
    return 1;
  }
  if (!statSync(HTACCESS, { throwIfNoEntry: false })?.isFile()) {
    console.error(`verificar-cache-fingerprint: arquivo ausente: ${HTACCESS}`);
    return 1;
  }

  let reprovas = 0;
  const reprovar = (mensagem: string): void => {
    reprovas += 1;
    console.error(`verificar-cache-fingerprint: ${mensagem}`);
  };

  // 1. .htaccess: linhas Header
  const htaccess = readFileSync(HTACCESS, 'utf-8');
  const linhasHeader = htaccess.match(/^\s*Header[^\n]*$/gm) ?? [];
  for (const linha of linhasHeader) {
    if (PROIBIDO.test(linha)) reprovar(`cabeçalho proibido em public/.htaccess: ${linha.trim()}`);
  }

  // 2. PHP da API e do servidor de dev: linhas de cache-control
  const arquivosPhp = [
    ...listarArquivos(join(RAIZ, 'public/api'))
      .filter((rel) => rel.endsWith('.php'))
      .map((rel) => join(RAIZ, 'public/api', rel)),
    ...(statSync(join(RAIZ, 'servidor/dev'), { throwIfNoEntry: false })?.isDirectory()
      ? readdirSync(join(RAIZ, 'servidor/dev'))
          .filter((nome) => nome.endsWith('.php'))
          .map((nome) => join(RAIZ, 'servidor/dev', nome))
      : [])
  ];
  let linhasCacheNaApi = 0;
  for (const arquivo of arquivosPhp) {
    for (const linha of readFileSync(arquivo, 'utf-8').split('\n')) {
      if (!/cache-control/i.test(linha)) continue;
      linhasCacheNaApi += 1;
      if (PROIBIDO.test(linha)) {
        reprovar(`cache proibido em ${relative(RAIZ, arquivo)}: ${linha.trim()}`);
      }
    }
  }

  // 3. Cache-Control efetivo de cada arquivo de dist
  const blocos = lerBlocos(htaccess);
  const arquivos = listarArquivos(DIST);
  let comCacheProibido = 0;
  for (const rel of arquivos) {
    const efetivo = cacheEfetivo(rel.split('/').pop() ?? rel, blocos);
    if (efetivo && PROIBIDO.test(efetivo)) {
      comCacheProibido += 1;
      reprovar(`dist/${rel} sairia com cache proibido: "${efetivo}"`);
    }
  }

  // Piso de varredura (L-36): nunca silencioso
  if (linhasHeader.length === 0) reprovar('zero linha Header no .htaccess: portão quebrado');
  if (arquivosPhp.length === 0) reprovar('zero PHP de API varrido: portão quebrado');
  if (arquivos.length === 0) reprovar('zero arquivo em dist: portão quebrado');

  console.log(
    `cache: cabeçalhos Header no .htaccess: ${linhasHeader.length} / linhas de cache nos PHP: ${linhasCacheNaApi} / arquivos analisados: ${arquivos.length} / com cache imutável ou público: ${comCacheProibido}`
  );
  return reprovas > 0 ? 1 : 0;
}

process.exitCode = principal();
