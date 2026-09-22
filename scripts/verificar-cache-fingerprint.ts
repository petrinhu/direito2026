/**
 * Portão pós-build (achado do líder, medido no site JÁ PUBLICADO,
 * 22/09/2026): o conserto das fontes (scripts/gerar-fontes.sh) não
 * chegava a quem já tinha visitado o site. Medido por ele, no ar:
 * inter-400/700 e lora-700 continuavam respondendo com o tamanho ANTIGO
 * (o do recorte quebrado), enquanto o mesmo endereço com um parâmetro
 * qualquer na consulta (que ignora o cache) já respondia com o tamanho
 * novo. Cabeçalho real: `Cache-Control: public, max-age=31536000,
 * immutable`, e resposta vinda de acerto de cache (CDN/navegador) com
 * idade de milhares de segundos.
 *
 * Causa: público/.htaccess marca `*.js|*.css|*.woff2|*.png|*.svg|*.webp`
 * como `immutable` por um ANO inteiro - seguro só quando o NOME do
 * arquivo muda sempre que o conteúdo muda (fingerprint/hash de
 * conteúdo). Arquivo em `public/`, copiado cru pelo Vite sem passar pelo
 * empacotador, mantém nome fixo - o par "nome fixo" + "cache imutável de
 * um ano" é o defeito, em QUALQUER arquivo nessa condição, não só fonte.
 *
 * Este portão varre TODO dist/ (não só fontes): para cada arquivo, deduz
 * o Cache-Control que o public/.htaccess de fato aplicaria (mod_headers
 * processa `<FilesMatch>` na ordem em que aparecem no arquivo, e
 * "Header set" substitui o valor anterior do mesmo cabeçalho - por isso
 * o bloco que corresponde por ÚLTIMO no arquivo é o que vale, não o
 * primeiro) e reprova se o resultado tiver "immutable" e o nome do
 * arquivo não trouxer uma marca de versão (hash) plausível.
 *
 * Piso de varredura (L-36): imprime sempre "arquivos analisados: N /
 * com cache imutável: M / sem impressão digital: F", nunca silencioso.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');
const DIST = process.env.VERIFICAR_CACHE_FINGERPRINT_DIST
  ? resolve(process.env.VERIFICAR_CACHE_FINGERPRINT_DIST)
  : resolve(RAIZ, 'dist');
const HTACCESS = resolve(RAIZ, 'public/.htaccess');

interface BlocoFilesMatch {
  readonly padrao: RegExp;
  readonly cacheControl: string;
}

/**
 * Lê public/.htaccess e extrai, na ordem em que aparecem, os pares
 * (padrão do FilesMatch, valor do Header set Cache-Control). Fonte única:
 * nunca duplicar a lista de extensões aqui, sempre ler do arquivo real -
 * uma cópia hardcoded divergiria do .htaccess de verdade sem avisar.
 */
function lerBlocosDoHtaccess(caminho: string): BlocoFilesMatch[] {
  const texto = readFileSync(caminho, 'utf-8');
  const blocos: BlocoFilesMatch[] = [];
  const regexBloco = /<FilesMatch\s+"([^"]+)">([\s\S]*?)<\/FilesMatch>/g;
  let m: RegExpExecArray | null;
  while ((m = regexBloco.exec(texto))) {
    const padraoTexto = m[1];
    const corpo = m[2];
    if (!padraoTexto || !corpo) continue;
    const cacheControlMatch = corpo.match(/Header set Cache-Control\s+"([^"]+)"/);
    const cacheControl = cacheControlMatch?.[1];
    if (!cacheControl) continue;
    blocos.push({
      padrao: new RegExp(padraoTexto),
      cacheControl
    });
  }
  return blocos;
}

/**
 * mod_headers processa os blocos na ordem do arquivo; "Header set"
 * substitui o valor anterior do MESMO cabeçalho. O último bloco que
 * casar com o nome do arquivo é o que decide o Cache-Control final.
 */
function cacheControlEfetivo(
  nomeArquivo: string,
  blocos: readonly BlocoFilesMatch[]
): string | undefined {
  let resultado: string | undefined;
  for (const bloco of blocos) {
    if (bloco.padrao.test(nomeArquivo)) resultado = bloco.cacheControl;
  }
  return resultado;
}

/**
 * Marca de versão plausível: um hífen seguido de EXATAMENTE 8 caracteres
 * do alfabeto base64url (A-Z a-z 0-9 - _), logo antes da extensão final.
 * Medido nos nomes que o próprio pacote já produz - Vite/Rollup
 * (ex. "Unidade-DEbo9-IJ.js", "index-B9JGuWy5.css") e o pacote workbox
 * (ex. "workbox-5824ddf3.js") usam os dois o mesmo comprimento fixo de 8,
 * nunca variável - por isso o comprimento exato é o sinal mais confiável
 * disponível, mais do que "tem algum dígito" (um hash de 8 caracteres
 * aleatórios do alfabeto base64url tem cerca de 1 em 4 chances de sair
 * só com letras, e um "-fallback"/"-legacy" comum quase nunca tem 8
 * caracteres exatos do alfabeto certo).
 */
const TEM_FINGERPRINT = /-[A-Za-z0-9_-]{8}\.[a-z0-9.]+$/;

function temFingerprint(nomeArquivo: string): boolean {
  return TEM_FINGERPRINT.test(nomeArquivo);
}

function listarArquivos(diretorio: string): string[] {
  const resultado: string[] = [];
  for (const entrada of readdirSync(diretorio, { withFileTypes: true })) {
    const caminho = join(diretorio, entrada.name);
    if (entrada.isDirectory()) {
      resultado.push(...listarArquivos(caminho));
    } else if (entrada.isFile()) {
      resultado.push(caminho);
    }
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

  const blocos = lerBlocosDoHtaccess(HTACCESS);
  if (blocos.length === 0) {
    console.error(
      'verificar-cache-fingerprint: nenhum bloco FilesMatch com Cache-Control encontrado no .htaccess'
    );
    return 1;
  }

  const arquivos = listarArquivos(DIST);
  let analisados = 0;
  let comCacheImutavel = 0;
  let semFingerprint = 0;

  for (const caminho of arquivos) {
    analisados += 1;
    const nome = caminho.split('/').pop()!;
    const cacheControl = cacheControlEfetivo(nome, blocos);
    if (!cacheControl || !cacheControl.includes('immutable')) continue;

    comCacheImutavel += 1;
    if (!temFingerprint(nome)) {
      semFingerprint += 1;
      console.error(
        `sem impressão digital: ${caminho} (Cache-Control efetivo: "${cacheControl}", nome fixo por até 1 ano)`
      );
    }
  }

  console.log(
    `arquivos analisados: ${analisados} / com cache imutável: ${comCacheImutavel} / sem impressão digital: ${semFingerprint}`
  );

  if (analisados === 0) {
    console.error('verificar-cache-fingerprint: zero arquivo analisado, portão quebrado');
    return 1;
  }

  return semFingerprint > 0 ? 1 : 0;
}

process.exit(principal());
