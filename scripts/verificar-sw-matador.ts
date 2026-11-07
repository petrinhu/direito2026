/**
 * Portão pós-build do service worker matador (7.3; troca o verificar-sw-api, LU-F4.5).
 *
 * O public/sw.js é o matador do service worker antigo (2.1, variante semnav do E1):
 * sem importScripts, sem workbox, sem laço de navegação. O portão confere:
 *  1. dist/sw.js é byte a byte igual a public/sw.js (VERIFICAR_SW_REFERENCIA);
 *  2. o texto tem as três peças do matador (skipWaiting, caches.keys,
 *     registration.unregister) e não tem navigate(, importScripts, precache nem workbox;
 *  3. nenhum workbox-*.js em dist;
 *  4. nenhum registro de service worker no pacote (navigator.serviceWorker.register,
 *     registerSW, virtual:pwa-register): o app novo não registra nada (T20);
 *  5. nenhum manifest: nenhum *.webmanifest em dist e nenhum rel="manifest" no index.html.
 * Piso: sem sw.js, ou sem arquivo varrido em (4), é falha.
 *
 * Variáveis (opcionais): DIST_PATH (padrão dist/), VERIFICAR_SW_REFERENCIA (padrão public/sw.js).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');
const DIST = resolve(process.env.DIST_PATH ?? join(RAIZ, 'dist'));
const REFERENCIA = resolve(process.env.VERIFICAR_SW_REFERENCIA ?? join(RAIZ, 'public/sw.js'));

const PECAS_OBRIGATORIAS = ['skipWaiting', 'caches.keys', 'registration.unregister'];
const PROIBIDOS_NO_TEXTO = [/navigate\(/, /importScripts/, /precache/i, /workbox/i];
const REGISTROS_PROIBIDOS = [
  /navigator\.serviceWorker\.register\s*\(/,
  /\bregisterSW\b/,
  /virtual:pwa-register/
];
const EXTENSOES_VARRIDAS = ['.js', '.mjs', '.html'];

function listarArquivos(pasta: string, base: string = pasta): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) return listarArquivos(caminho, base);
    return [relative(base, caminho).split(sep).join('/')];
  });
}

function principal(): number {
  const swDist = join(DIST, 'sw.js');
  if (!statSync(swDist, { throwIfNoEntry: false })?.isFile()) {
    console.error('verificar-sw-matador: sw.js ausente (rode o build antes): sw analisados: 0');
    return 1;
  }
  if (!statSync(REFERENCIA, { throwIfNoEntry: false })?.isFile()) {
    console.error(`verificar-sw-matador: referência ausente: ${REFERENCIA}`);
    return 1;
  }

  let falharam = 0;
  const reprovar = (mensagem: string): void => {
    falharam += 1;
    console.error(`verificar-sw-matador: ${mensagem}`);
  };

  // 1. identidade com o público
  const bytesDist = readFileSync(swDist);
  if (!bytesDist.equals(readFileSync(REFERENCIA))) {
    reprovar(`dist/sw.js não é igual ao público (${REFERENCIA})`);
  }

  // 2. peças do matador e termos proibidos no texto
  const texto = bytesDist.toString('utf-8');
  if (texto.length === 0) reprovar('dist/sw.js vazio é portão quebrado');
  for (const peca of PECAS_OBRIGATORIAS) {
    if (!texto.includes(peca)) reprovar(`sw sem a peça do matador: ${peca}`);
  }
  for (const proibido of PROIBIDOS_NO_TEXTO) {
    const achado = texto.match(proibido);
    if (achado) reprovar(`sw contém ${achado[0]} (proibido no matador)`);
  }

  // 3, 4 e 5: varredura do pacote
  const arquivos = listarArquivos(DIST);
  const varridos = arquivos.filter(
    (rel) => rel !== 'sw.js' && EXTENSOES_VARRIDAS.some((ext) => rel.endsWith(ext))
  );
  for (const rel of arquivos) {
    if (/^workbox-.*\.js$/.test(rel.split('/').pop() ?? '')) {
      reprovar(`workbox no pacote: dist/${rel}`);
    }
    if (rel.endsWith('.webmanifest')) {
      reprovar(`manifest no pacote: dist/${rel}`);
    }
    if (/registerSW/.test(rel)) {
      reprovar(`registro de service worker no pacote (arquivo registerSW): dist/${rel}`);
    }
  }
  for (const rel of varridos) {
    const conteudo = readFileSync(join(DIST, rel), 'utf-8');
    for (const padrao of REGISTROS_PROIBIDOS) {
      if (padrao.test(conteudo)) {
        reprovar(`registro de service worker no pacote (register): dist/${rel}`);
      }
    }
    if (rel === 'index.html' && /rel\s*=\s*["']manifest["']/.test(conteudo)) {
      reprovar('manifest no pacote: dist/index.html tem rel="manifest"');
    }
  }

  if (varridos.length === 0) {
    reprovar('zero arquivo varrido em dist é portão quebrado (piso)');
  }
  console.log(`sw matador: arquivos analisados=${varridos.length + 1} / falharam=${falharam}`);
  return falharam > 0 ? 1 : 0;
}

process.exitCode = principal();
